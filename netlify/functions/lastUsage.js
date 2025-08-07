const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

function getClient() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error("Supabase credentials not set");
    }
    return createClient(SUPABASE_URL, SUPABASE_KEY);
}

exports.handler = async (event) => {
    const supabase = getClient();
    
    // Insert a record with document_title="ping" regardless of HTTP method
    try {
        const { data: insertData, error: insertError } = await supabase
            .from('requests')
            .insert([
                { document_title: "ping", "app_id": "ping" }
            ]);
            
        if (insertError) {
            console.error("Error inserting ping record:", insertError);
            // Continue with the function even if insert fails
        } else {
            console.log("Successfully inserted ping record");
        }
    } catch (insertException) {
        console.error("Exception during ping record insertion:", insertException);
        // Continue with the function even if insert fails
    }
    
    // Original GET functionality
    if (event.httpMethod !== "GET") {
        return { statusCode: 405, body: "Method Not Allowed" };
    }

    try {

        // Get the most recent record from 'requests'
        const { data, error } = await supabase
            .from('requests')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            console.error("Error fetching last usage:", error);
            return { statusCode: 500, body: JSON.stringify({ error: "Database error" }) };
        }

        if (!data) {
            return { statusCode: 404, body: JSON.stringify({ error: "No usage records found" }) };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ lastUsage: data }),
        };
    } catch (error) {
        console.error("Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};