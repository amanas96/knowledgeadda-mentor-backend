import { ChatGroq } from "@langchain/groq";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import config from "../../config/index.js";

// 1. Initialize Groq Model
const model = new ChatGroq({
  apiKey: config.llm.groqApiKey,
  modelName: config.llm.models.explanation, // 'llama3-70b-8192'
  temperature: 0.5, // Balanced for creativity and accuracy
  maxTokens: 1024,
});

// 2. System Prompt (Architecture Section 9)
const SYSTEM_TEMPLATE = `You are a Senior UPSC Mentor.
Your goal is to explain concepts clearly, concisely, and with strict relevance to the Civil Services Exam.

GUIDELINES:
- Base your answer ONLY on the provided Context.
- If the context doesn't contain the answer, say "I cannot find this in the provided documents."
- Use bullet points for readability.
- Highlight key keywords relevant to UPSC Mains.
- Cite the source context if possible.

CONTEXT:
{context}`;

// 3. Chat Prompt with History
const prompt = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_TEMPLATE],
  new MessagesPlaceholder("chat_history"), // Inject conversation history
  ["human", "{question}"],
]);

// 4. Build the Chain
export const explanationChain = RunnableSequence.from([
  {
    question: (input) => input.question,
    chat_history: (input) => input.chat_history,
    context: (input) => input.context, // Context injected from Retriever in the service layer
  },
  prompt,
  model,
  new StringOutputParser(),
]);
