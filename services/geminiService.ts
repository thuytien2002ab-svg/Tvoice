import { GoogleGenAI, Modality } from "@google/genai";

export const generateSpeech = async (
  apiKey: string,
  text: string, 
  voice: string,
  speakingRate: number,
  pitch: number,
  volumeGainDb: number,
): Promise<string | null> => {
  if (!apiKey) {
    throw new Error("Khóa API Gemini chưa được cung cấp.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
          speakingRate,
          pitch,
          volumeGainDb,
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (base64Audio) {
      return base64Audio;
    } else {
      console.error("API response did not contain audio data:", response);
      // Check for safety ratings or other reasons for no content
      if (response.candidates?.[0]?.finishReason !== 'STOP') {
        throw new Error(`Quá trình tạo giọng nói đã bị dừng vì: ${response.candidates?.[0]?.finishReason}. Vui lòng kiểm tra lại văn bản của bạn.`);
      }
      return null;
    }

  } catch (error) {
    console.error("Error generating speech with Gemini API:", error);
    if (error instanceof Error && error.message.includes('API key not valid')) {
       throw new Error("Khóa API Gemini không hợp lệ. Vui lòng kiểm tra và thử lại.");
    }
    throw new Error("Không thể tạo giọng nói. Vui lòng thử lại sau.");
  }
};
