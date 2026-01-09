import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

// 1. Initialize Fast Model (Llama 8B is cheap & fast)
const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: process.env.INTENT_MODEL || "llama-3.1-8b-instant",
  temperature: 0,
});

// 2. Define Prompt
const template = `
Analyze the user query and classify the intent into exactly one category: "QUIZ" or "EXPLAIN".

RULES:
- If the user asks for questions, tests, MCQs, or practice -> "QUIZ"
- If the user asks for definitions, summaries, concepts, or "what is" -> "EXPLAIN"
- If unclear, default to "EXPLAIN"

Query: {query}

Intent (respond with one word only):`;

const prompt = PromptTemplate.fromTemplate(template);

// 3. Export Chain
export const intentClassifierChain = RunnableSequence.from([
  prompt,
  model,
  new StringOutputParser(),
]);
