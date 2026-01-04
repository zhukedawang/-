
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Lesson } from "../types";

// Removed global API_KEY constant to comply with SDK guidelines for dynamic initialization.

/**
 * Generates speech audio using the Gemini TTS model.
 */
export async function generateSpeech(text: string): Promise<Uint8Array | null> {
  try {
    // Initialize GoogleGenAI right before the API call to ensure latest key is used.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    // Decode base64 to Uint8Array (Raw PCM)
    const binaryString = atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error("Speech generation failed:", error);
    return null;
  }
}

/**
 * Recognizes a book from an image and suggests a lesson.
 * Fixed the return type to include 'suggestedLesson' which was missing from the Partial<Lesson> interface.
 */
export async function recognizeBook(base64Image: string): Promise<{ title?: string; author?: string; suggestedLesson?: string } | null> {
  try {
    // Initialize GoogleGenAI with the environment API key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: '请识别这张图片中的书籍名称和作者。如果是语文课本，请尝试列出其中一篇文言文的标题。请返回 JSON 格式：{ "title": "书名", "author": "作者", "suggestedLesson": "课文名" }' }
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            suggestedLesson: { type: Type.STRING }
          }
        }
      }
    });

    const text = response.text;
    return JSON.parse(text || "{}");
  } catch (error) {
    console.error("Book recognition failed:", error);
    return null;
  }
}

/**
 * Fetches content for a specific lesson by name.
 */
export async function fetchLessonContent(lessonName: string): Promise<Lesson | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `请为我提供文言文或英语课文《${lessonName}》的内容。
      要求：分成句子，每一句原文对应一句准确的翻译。
      如果是文言文，翻译要直白易懂。
      返回JSON数组。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            sentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["original", "translation"]
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    return {
      id: Math.random().toString(36).substring(2, 11),
      title: data.title || lessonName,
      category: 'custom',
      sentences: (data.sentences || []).map((s: any, i: number) => ({
        ...s,
        id: `s-${i}`
      }))
    };
  } catch (error) {
    console.error("Failed to fetch lesson content:", error);
    return null;
  }
}
