import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateNewYearWishes = async (topic: string = "2026 Chinese New Year"): Promise<string[]> => {
  try {
    const prompt = `Generate 5 short, creative, and festive Chinese New Year wishes/idioms for the year 2026 (Year of the Horse). 
    Max 6 characters per wish.
    Output JSON format: { "wishes": ["string", "string", ...] }`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wishes: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return ["新年快乐", "万事如意", "马到成功", "2026大吉", "恭喜发财"];
    
    const parsed = JSON.parse(jsonText);
    return parsed.wishes || ["新年快乐", "万事如意"];

  } catch (error) {
    console.error("Failed to generate wishes:", error);
    return ["新年快乐", "岁岁平安", "2026吉祥", "财源广进", "身体健康"];
  }
};