import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getEmergencyGuidance(bloodGroup: string, urgency: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `An emergency blood request has been posted for blood group ${bloodGroup} with urgency level ${urgency}.
      Provide a concise 3-bullet point guide for users of the "Rakta-Seva Connect" app:
      1. What the donor should do before arriving.
      2. Immediate first aid tips related to blood loss recovery.
      3. Safety precautions for the donor. 
      Keep it urgent but calm.`,
    });
    return response.text || "Please consult a medical professional immediately.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Please consult a medical professional immediately. Ensure the donor is hydrated and well-rested.";
  }
}
