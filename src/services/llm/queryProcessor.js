import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";

dotenv.config();

// Initialize Fast Model for Rephrasing
const rephraserModel = new ChatGroq({
  model: "llama-3.3-70b-versatile", // Fast and smart enough for this
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0, // Keep it strictly factual
});

export const optimizeQuery = async (originalQuery) => {
  try {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a Search Query Optimizer for a UPSC exam database.
         Your task is to rewrite the user's input into a specific, keyword-rich search query.
         
         Rules:
         1. Remove filler words (e.g., "tell me about", "I want to know").
         2. Resolve ambiguity if possible.
         3. Keep it concise.
         4. Output ONLY the rewritten query string. No quotes, no explanations.
         
         Example:
         Input: "Why did the 1857 revolt fail?" -> Output: "Causes of failure 1857 revolt India"
         Input: "Gandhian era movements" -> Output: "Key movements Gandhian Era Indian Freedom Struggle"
         `,
      ],
      ["human", "{query}"],
    ]);

    const chain = prompt.pipe(rephraserModel).pipe(new StringOutputParser());

    const refinedQuery = await chain.invoke({ query: originalQuery });
    return refinedQuery.trim();
  } catch (error) {
    console.error("⚠️ Query Optimization Failed:", error.message);
    return originalQuery; // Fallback to original if AI fails
  }
};
