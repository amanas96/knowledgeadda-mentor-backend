import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  ROUTER_TEMPLATE,
  QUIZ_TEMPLATE,
  EXPLAIN_TEMPLATE,
} from "../prompts/templates.js";
import dotenv from "dotenv";
dotenv.config();

// Models
const fastModel = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  modelName: "llama3-8b-8192",
  temperature: 0,
});
const smartModel = new ChatGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY,
  modelName: "gemini-pro",
  temperature: 0.7,
});

// Chains
export const routerChain = RunnableSequence.from([
  PromptTemplate.fromTemplate(ROUTER_TEMPLATE),
  fastModel,
  new StringOutputParser(),
]);

export const quizChain = RunnableSequence.from([
  PromptTemplate.fromTemplate(QUIZ_TEMPLATE),
  smartModel, // Uses Smart Gemini
  new StringOutputParser(),
]);

export const explainChain = RunnableSequence.from([
  PromptTemplate.fromTemplate(EXPLAIN_TEMPLATE),
  fastModel, // Uses Fast Groq
  new StringOutputParser(),
]);
