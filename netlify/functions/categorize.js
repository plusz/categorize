// netlify/functions/categorize.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Client, fql } = require("fauna");
const base64js = require('base64-js');

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GOOGLE_API_KEY;
const FAUNA_SECRET = process.env.FAUNA_SECRET;

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const pdfBase64 = body.pdf;
        const categories = body.categories;
        let authCode = body.authCode;
        // sanitize authCode
        authCode = authCode.replace(/[^a-zA-Z0-9]/g, "");

        if (!pdfBase64 || !categories || !Array.isArray(categories) || categories.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid input." }) };
        }
        if (!API_KEY) {
            return {statusCode: 500, body: JSON.stringify({error: "API Key not set."})};
        }

        // Check PDF size using base64js
        const pdfBytes = base64js.toByteArray(pdfBase64);
        const pdfSizeInBytes = pdfBytes.length;

        if (pdfSizeInBytes > 512 * 1024) { // 512 kB
            return { statusCode: 400, body: JSON.stringify({ error: "PDF size exceeds 512kB limit." }) };
        }

        if (!authCode) {
            return {statusCode: 500, body: JSON.stringify({error: "Auth code not set."})};
        }
        
        // Verify authCode and credits
        const client = new Client({ secret: FAUNA_SECRET });
        const sanitizedAuthCode = authCode.replace(/[^a-zA-Z0-9]/g, "");

        const user = await client.query(
            fql`
              categories_credits.users_by_authCode(${sanitizedAuthCode}).first()
            `
          );    
        
        if (!user.data) {
                // Log failed attempt with authCode
                const userIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';

                await client.query(
                fql`
                    failedAttempts.create({
                    authCode: ${authCode},
                    ipAddress: ${userIp},
                    timestamp: ${Date.now()}
                    })
                `
                );

                // Check if there are too many failed attempts for this IP address
                const failedAttempts = await client.query(
                fql`
                    failedAttempts
                    .where(.ipAddress == ${userIp} && .timestamp > ${Date.now() - 15 * 60 * 1000}) // Last 15 minutes
                    .count()
                `
                );

                return { statusCode: 401, body: JSON.stringify({ error: `Unauthorized ${sanitizedAuthCode.toString()}` }) };
        }

        if (user.data.credits <= 0) {
            return { statusCode: 402, body: JSON.stringify({ error: "Insufficient credits" }) };
        }

        const creditsLeft = user.data.credits - 1;

        await client.query(
            fql`
                categories_credits.firstWhere(.key == ${sanitizedAuthCode})?.update({credits: ${creditsLeft}})
            `
        );

        // Generate content with LLM
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `Analyze the content of the provided PDF document and generate a JSON output containing the following:
    1. The document title.
    2. A one-sentence description or summary of the document.
    3. Up to 3 categories from the provided list that the document matches: ${categories.join(', ')}.
    4. Up to 3 taxonomies that the user may consider adding to their set.`;

        const parts = [
            {
                text: prompt,
            },
            {
                inlineData: {
                    mimeType: "application/pdf",
                    data: pdfBase64,
                },
            },
        ];

        const result = await model.generateContent({ contents: [{ parts }] });
        const response = await result.response;
        let rawResponse = response.text();

        let cleanedResponse = rawResponse.match(/{.*}/s)?.[0] || '{}';

        let jsonResponse = JSON.parse(cleanedResponse);
        jsonResponse.credits_left = creditsLeft;

        await client.query(
            fql`
                requests.create(${jsonResponse})
            `
        );

        return {
            statusCode: 200,
            body: JSON.stringify({jsonResponse}),
        };
    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
