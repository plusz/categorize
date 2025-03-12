// netlify/functions/categorize.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const faunadb = require("fauna");

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



        if (!pdfBase64 || !categories || !Array.isArray(categories) || categories.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid input." }) };
        }
        if (!API_KEY) {
            return {statusCode: 500, body: JSON.stringify({error: "API Key not set."})};
        }

        const q = faunadb.query;
        const client = new faunadb.Client({ secret: FAUNA_SECRET });
        
        // Verify authCode and credits
        const user = await client.query(
            q.Get(q.Match(q.Index("users_by_authCode"), authCode))
        );

        if (!user) {
            return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
        }

        if (user.data.credits <= 0) {
            return { statusCode: 402, body: JSON.stringify({ error: "Insufficient credits" }) };
        }

        // Deduct credit
        await client.query(
            q.Update(user.ref, {
                data: { credits: user.data.credits - 1 },
            })
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
        const text = response.text();

        return {
            statusCode: 200,
            body: JSON.stringify({ category: text.trim() }),
        };
    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};