/**
 * Service for document categorization API calls
 */

interface CategorizationResponse {
  jsonResponse: Record<string, any>;
}

/**
 * Categorizes a PDF document using the serverless function
 * @param pdfBase64 Base64 encoded PDF file
 * @param categories List of categories to classify against
 * @param authCode Authorization code for API access
 * @returns Categorization results
 */
export const categorizePdf = async (
  pdfBase64: string, 
  categories: string[], 
  authCode: string
): Promise<CategorizationResponse> => {
  try {
    const response = await fetch('/.netlify/functions/categorize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdf: pdfBase64,
        categories,
        authCode,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Unknown error occurred';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        // If JSON parsing fails, use the raw text
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorMessage}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in categorizePdf:', error);
    throw error;
  }
};
