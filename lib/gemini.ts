import { GoogleGenAI } from "@google/genai";

export const generateAIImage = async (base64Source: string, prompt: string, aspectRatio: '9:16' | '16:9' = '9:16') => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Source.split(',')[1],
              mimeType: 'image/png',
            },
          },
          {
            text: `${prompt}. High resolution, ${aspectRatio} aspect ratio, cinematic lighting, photorealistic, maintaining person's facial features and identity. No text, no watermark.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        }
      }
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      for (const part of candidates[0].content.parts) {
        if (part.inlineData) {
          const base64EncodeString: string = part.inlineData.data;
          return `data:image/png;base64,${base64EncodeString}`;
        }
      }
    }
    
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
