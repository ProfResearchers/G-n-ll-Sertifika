
import { GoogleGenAI } from "@google/genai";

export const generateImpactMessage = async (name: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Gönüllü ismi: ${name}. Bu kişi bir bilimsel araştırmaya gönüllü olarak destek verdi. 
      Lütfen bu kişiye araştırmaya katkılarından dolayı çok kısa (maksimum 15 kelime), 
      profesyonel ve içten bir teşekkür mesajı yaz (Türkçe). 
      Örneğin: "Katkılarınız, veri analizi sürecimize ışık tuttu ve bilimin ilerlemesine yardımcı oldu."`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 100,
      }
    });

    return response.text?.trim() || "Bilimsel araştırmalarımıza sunduğunuz değerli katkılar için teşekkür ederiz.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Bilimsel araştırmalarımıza sunduğunuz değerli katkılar için teşekkür ederiz.";
  }
};
