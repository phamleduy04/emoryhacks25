import { GoogleGenAI } from "@google/genai";
import { action, mutation } from "./_generated/server";
import { v } from "convex/values";

interface ParsedEmail {
  final_price: number | null;
  tax: number | null;
  fees: number | null;
}

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY || "",
});

const getPrompt = (emailBody: string) => {
  return `You are an information-extraction model. Extract numerical values from the email exactly as instructed.\n\nReturn a JSON object following this TypeScript interface:\n\nParsedEmail {\n  final_price: number | null;\n  tax: number | null;\n  fees: number | null;\n}\n\nRules:\n- Output only the JSON object.\n- Do not wrap the result in code blocks or add any commentary.\n- Parse only from the content of the email.\n- Remove currency symbols and commas (e.g., $23,500 → 23500).\n- If a value is missing, unclear, or cannot be confidently interpreted as a number, set it to null.\n- If multiple values exist, choose the most final or explicit one.\n- Include no extra fields.\n\nEmail to parse:\n${emailBody}`
};

export const parseEmail = action({
  args: {
    emailContent: v.string()
  },
  handler: async (_ctx, args) => {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: getPrompt(args.emailContent),
    });
    const parsedEmail = JSON.parse(response.text || "") as ParsedEmail;
    return parsedEmail;
  },
});
