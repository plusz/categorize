// netlify/functions/categorize.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GOOGLE_API_KEY;

exports.handler = async (event) => {
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {
        const body = JSON.parse(event.body);
        const pdfBase64 = body.pdf;
        const categories = body.categories;

        if (!pdfBase64 || !categories || !Array.isArray(categories) || categories.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: "Invalid input." }) };
        }
        if (!API_KEY) {
            return {statusCode: 500, body: JSON.stringify({error: "API Key not set."})};
        }

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