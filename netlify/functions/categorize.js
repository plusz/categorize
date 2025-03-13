// netlify/functions/categorize.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Client, fql, FaunaError } = require("fauna");

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
        const authCode = body.authCode;

        console.log("Authcode:", authCode);

        if (!pdfBase64 || !categories || !Array.isArray(categories) || categories.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid input." }) };
        }
        if (!API_KEY) {
            return {statusCode: 500, body: JSON.stringify({error: "API Key not set."})};
        }
        if (!authCode) {
            return {statusCode: 500, body: JSON.stringify({error: "Auth code not set."})};
        }
        
        // Verify authCode and credits
        const client = new Client({ secret: FAUNA_SECRET });

        const user = await client.query(
            fql`
              categories_credits.users_by_authCode(${authCode}).first()
            `
          );    
        

        if (!user.data) {
            return { statusCode: 401, body: JSON.stringify({ error: `Unauthorized ${authCode.toString()}` }) };
        }

        console.log("User:", user);

        if (user.data.credits <= 0) {
            return { statusCode: 402, body: JSON.stringify({ error: "Insufficient credits" }) };
        }


        console.log(`User ${user.data.key} credits:`, user.data.credits);

        const creditsLeft = user.data.credits - 1;

        await client.query(
            fql`
                categories_credits.firstWhere(.key == ${authCode})?.update({credits: ${creditsLeft}})
            `
        );

        // Generate content with LLM
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `Given the content of a PDF document, categorize it into one of the following categories: ${categories.join(', ')}. Please respond with only the category name.`;

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
        let text = response.text() + `<br>Credits left: ${creditsLeft}`;

        return {
            statusCode: 200,
            body: JSON.stringify({ category: text.trim() }),
        };
    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};