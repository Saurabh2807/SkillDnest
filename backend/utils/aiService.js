const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


const analyzeServiceRequest = async (userMessage) => {

    const prompt = `
You are an AI assistant for a cooperative gig services platform.

Analyze the customer's service request.

Return ONLY valid JSON.
Do not use markdown.
Do not add any explanation.

Extract these fields:

service
location
category
duration
priority

Allowed categories:
Household
Community
Agriculture

Example:

Customer request:
"Mujhe Satna mein 2 din ke liye wheat harvesting worker chahiye"

Return:
{
  "service": "Harvesting",
  "location": "Satna",
  "category": "Agriculture",
  "duration": "2 days",
  "priority": "nearby"
}

Customer request:
${userMessage}
`;

    try {

        const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt
        });

        const text = response.text.trim();

        const cleanedText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        return JSON.parse(cleanedText);

    } catch (error) {

        console.error(
            "Gemini AI Error:",
            error.message
        );

        throw new Error(
            "Failed to analyze service request"
        );
    }
};


module.exports = analyzeServiceRequest;