import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "langchain/output_parsers"; // Added for safety
import { z } from "zod";

import { INTENT_TEMPLATE } from "../prompts/intentPrompt.js";
import { QUIZ_TEMPLATE } from "../prompts/quizPrompt.js";
import { RAG_TEMPLATE } from "../prompts/ragPrompt.js";
import { getRetriever } from "../config/vectorStore.js";

// ============================================================
// 1. MODEL CONFIGURATIONS
// ============================================================

const groqModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "llama-3.1-70b-versatile",
  temperature: 0,
});

const groqFallbackModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "llama-3.1-8b-instant",
  temperature: 0,
});

const geminiModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-1.5-flash",
  temperature: 0.7,
  maxOutputTokens: 8192, // Gemini 1.5 allows higher output
});

// ============================================================
// 2. STATIC CHAINS (Initialize ONCE)
// ============================================================

// --- ROUTER CHAIN ---
const routerSequence = RunnableSequence.from([
  PromptTemplate.fromTemplate(INTENT_TEMPLATE),
  groqModel,
  new StringOutputParser(),
]);

export const routerChain = async (query) => {
  try {
    // Invoke the pre-built chain
    const intent = await routerSequence.invoke({ query });
    const cleanIntent = intent
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, ""); // Remove punctuation

    if (["QUIZ", "EXPLAIN"].includes(cleanIntent)) {
      console.log(`🎯 Router: ${cleanIntent}`);
      return cleanIntent;
    }
    return "EXPLAIN";
  } catch (error) {
    console.error("❌ Router failed:", error.message);
    return "EXPLAIN";
  }
};

// --- QUIZ CHAIN (With Zod Safety) ---

// Define strict schema so the model knows EXACTLY what valid JSON looks like
const quizSchema = z.array(
  z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.string(),
    explanation: z.string(),
  })
);

const quizParser = StructuredOutputParser.fromZodSchema(quizSchema);

const quizSequence = RunnableSequence.from([
  PromptTemplate.fromTemplate(QUIZ_TEMPLATE + "\n{format_instructions}"), // Add formatting instructions
  geminiModel,
  quizParser, // Auto-parses JSON or throws understandable error
]);

export const quizGenChain = async (topic, options = {}) => {
  try {
    console.log("🧠 Generating Quiz for:", topic);

    // LangChain automatically injects a "format_instructions" string into the prompt
    const questions = await quizSequence.invoke({
      topic,
      context: options.context || "General Knowledge",
      format_instructions: quizParser.getFormatInstructions(),
    });

    return questions; // It is already a JS Object/Array! No JSON.parse needed.
  } catch (error) {
    console.error("❌ Quiz Generation Failed:", error.message);
    // Simple fallback if Zod fails
    return [];
  }
};

// ============================================================
// 3. DYNAMIC CHAIN (RAG)
// ============================================================

const formatDocsForContext = (docs) => {
  return docs.map((d) => `${d.pageContent}`).join("\n\n");
};

export const explanationChain = async (query, options = {}) => {
  const { subject = null, history = "" } = options;

  try {
    // 1. Get Retriever (This still needs to be dynamic per request if filtering by subject)
    const retriever = await getRetriever({
      namespace: subject,
      k: 4,
    });

    // 2. Retrieve Docs manually (Cleaner than making a full chain for it)
    const docs = await retriever.getRelevantDocuments(query);
    const context = formatDocsForContext(docs);

    if (!docs.length) console.warn("⚠️ No relevant docs found in RAG.");

    // 3. Generate Answer
    // We reuse the model instance, but create a small ephemeral chain for the prompt
    const ragSequence = RunnableSequence.from([
      PromptTemplate.fromTemplate(RAG_TEMPLATE),
      groqModel,
      new StringOutputParser(),
    ]);

    const response = await ragSequence.invoke({
      query,
      context,
      history,
    });

    return response;
  } catch (error) {
    console.error("❌ Explanation chain failed:", error.message);
    // Fallback logic...
    return "I am unable to access my knowledge base right now. Please try again.";
  }
};

export default { routerChain, quizGenChain, explanationChain };
