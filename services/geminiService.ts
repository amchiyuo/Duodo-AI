import { GoogleGenAI, Content } from "@google/genai";
import { Message, Role } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Helper to prepare history
const prepareHistory = (history: Message[]): Content[] => {
    return history.map((msg) => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.text }],
    }));
};

/**
 * Streams a message response from the Gemini API.
 */
export async function* streamMessageToGemini(
  model: string,
  history: Message[],
  newMessage: string,
  systemInstruction?: string
): AsyncGenerator<string, void, unknown> {
  try {
    const historyContent = prepareHistory(history);

    const chat = ai.chats.create({
      model: model,
      history: historyContent,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const result = await chat.sendMessageStream({
      message: newMessage
    });

    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        yield chunkText;
      }
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate response");
  }
}

/**
 * Generates a short title for the chat based on the first user message.
 * Uses 'gemini-2.5-flash' for speed and efficiency.
 */
export const generateChatTitle = async (
    firstMessage: string
): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the following user request into a very short, concise title (max 5 words) in the same language as the request. Do not add quotes or periods. Request: "${firstMessage}"`,
        });
        return response.text?.trim() || 'New Chat';
    } catch (error) {
        console.error("Failed to generate title:", error);
        return 'New Chat';
    }
}

/**
 * Standard non-streaming send (fallback if needed)
 */
export const sendMessageToGemini = async (
  model: string,
  history: Message[],
  newMessage: string,
  systemInstruction?: string
): Promise<string> => {
  try {
    const historyContent = prepareHistory(history);
    const chat = ai.chats.create({
      model: model,
      history: historyContent,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    const response = await chat.sendMessage({
      message: newMessage
    });

    return response.text || "No response text received.";
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "Failed to generate response");
  }
};