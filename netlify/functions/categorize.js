// netlify/functions/categorize.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");

const MODEL_NAME = "gemini-2.0-flash";
const API_KEY = process.env.GOOGLE_API_KEY;
const LLM_PROMPT = process.env.LLM_PROMPT;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;


// Supabase database service
const dbServiceNew = {
    // Initialize Supabase client
    getClient() {
        if (!SUPABASE_URL || !SUPABASE_KEY) {
            throw new Error("Supabase credentials not set");
        }
        return createClient(SUPABASE_URL, SUPABASE_KEY);
    },
    
    // Get user data by auth code
    async getUserData(authCode) {
        const supabase = this.getClient();
        const sanitizedAuthCode = authCode.replace(/[^a-zA-Z0-9]/g, "");
        
        const { data, error } = await supabase
            .from('credits')
            .select('*')
            .eq('key', sanitizedAuthCode)  // TODO encrypt keys
            .single();
            
        if (error) {
            console.error("Error fetching user data:", error);
            return null;
        }
        
        return data;
    },
    
    // Save failed authentication attempt
    async saveFailedAttempt(authCode, ipAddress) {
        const supabase = this.getClient();
        const { error } = await supabase
            .from('failedAttempts')
            .insert({
                authCode: authCode,
                ipAddress: ipAddress,
            });
            
        if (error) {
            console.error("Error saving failed attempt:", error);
        }
    },
    
    // Read failed authentication attempts for an IP address
    async readFailedAttempts(ipAddress, timeWindowMs) {
        const supabase = this.getClient();
        const timeThreshold = new Date(Date.now() - timeWindowMs).toISOString();
        
        const { count, error } = await supabase
            .from('failedAttempts')
            .select('*', { count: 'exact', head: true })
            .eq('ipAddress', ipAddress)
            .gte('created_at', timeThreshold);
            
        if (error) {
            console.error("Error reading failed attempts:", error);
            return 0;
        }
        
        return count;
    },
    
    // Update client credits
    async updateClientCredits(authCode, newCreditAmount) {
        const supabase = this.getClient();
        const sanitizedAuthCode = authCode.replace(/[^a-zA-Z0-9]/g, "");
        
        const { data, error } = await supabase
            .from('credits')
            .update({ credits: newCreditAmount })
            .eq('key', sanitizedAuthCode)  // TODO encrypt keys
            .select();
                        
        if (error) {
            console.error("Error updating client credits:", error);
            return false;
        }
        
        // Check if any rows were updated
        if (!data || data.length === 0) {
            console.error("No rows were updated when updating client credits");
            return false;
        }
        
        return true;
    },
    
    // Create a document in the database
    async createDocument(collectionName, documentData) {
        const supabase = this.getClient();
        
        // For Supabase, store the entire JSON in a 'document' column
        const { error } = await supabase
            .from(collectionName)
            .insert({
                document: documentData
            });
            
        if (error) {
            console.error(`Error creating document in ${collectionName}:`, error);
        }
    }
};

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
            return { statusCode: 500, body: JSON.stringify({ error: "API Key not set." }) };
        }

        // Check PDF size (Base64 size is approximately 4/3 of the original file size)
        const pdfSizeInBytes = (pdfBase64.length * 3) / 4 - (pdfBase64.endsWith('==') ? 2 : pdfBase64.endsWith('=') ? 1 : 0);

        if (pdfSizeInBytes > 512 * 1024) { // 512 kB
            return { statusCode: 400, body: JSON.stringify({ error: "PDF size exceeds 512kB limit." }) };
        }

        if (!authCode) {
            return { statusCode: 500, body: JSON.stringify({ error: "Auth code not set." }) };
        }

        // Check for too many failed attempts from this IP before proceeding
        const userIp = event.headers['x-forwarded-for'] || event.headers['client-ip'] || 'unknown';
        const failedAttempts = await dbServiceNew.readFailedAttempts(userIp, 15 * 60 * 1000); // Last 15 minutes
        
        if (failedAttempts >= 5) {
            return { 
                statusCode: 429, 
                body: JSON.stringify({ 
                    error: "Too many incorrect requests. Please try again later." 
                }) 
            };
        }

        // Verify authCode and credits
        const user = await dbServiceNew.getUserData(authCode);

        console.log(user);

        if (!user) {
            // Log failed attempt with authCode
            await dbServiceNew.saveFailedAttempt(authCode, userIp);

            return { statusCode: 401, body: JSON.stringify({ error: `Unauthorized. Please check your auth code.` }) };
        }

        if (user.credits <= 0) {
            return { statusCode: 402, body: JSON.stringify({ error: "Insufficient credits" }) };
        }

        const creditsLeft = user.credits - 1;

        if (!(await dbServiceNew.updateClientCredits(authCode, creditsLeft))) {
            return { statusCode: 500, body: JSON.stringify({ error: "Failed to update client credits" }) };
        }

        // Generate content with LLM
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });

        const prompt = `${LLM_PROMPT}`;

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

        const result = await model.generateContent({
            contents: [{ parts }],
            generationConfig: {
                maxOutputTokens: 2048, // Set your desired maximum output tokens here
            },
        });


        const response = await result.response;
        let rawResponse = response.text();

        let cleanedResponse = rawResponse.match(/{.*}/s)?.[0] || '{}';


        let jsonResponse = JSON.parse(cleanedResponse);
        jsonResponse.credits_left = creditsLeft;

        await dbServiceNew.createDocument('requests', { document: jsonResponse });

        return {
            statusCode: 200,
            body: JSON.stringify({ jsonResponse }),
        };
    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};