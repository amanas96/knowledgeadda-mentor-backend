import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import config from "../../config/index.js";

// 1. Define the Output Schema (Architecture Section 10)
const quizSchema = z.object({
  topic: z.string().describe("The main topic of the quiz"),
  questions: z
    .array(
      z.object({
        id: z.number(),
        question: z.string().describe("The question text, UPSC style"),
        options: z.array(z.string()).describe("4 options, A, B, C, D"),
        correctAnswer: z.number().describe("Index of correct answer (0-3)"),
        explanation: z
          .string()
          .describe("Detailed explanation of why the answer is correct"),
        difficulty: z.enum(["Easy", "Medium", "Hard"]),
      })
    )
    .length(5)
    .describe("Generate exactly 5 questions"),
});

const parser = StructuredOutputParser.fromZodSchema(quizSchema);

// 2. Initialize Gemini Model
const model = new ChatGoogleGenerativeAI({
  modelName: config.llm.models.quiz, // 'gemini-1.5-flash'
  maxOutputTokens: 2048,
  temperature: 0.2, // Low temperature for consistent formatting
  apiKey: config.llm.googleApiKey,
});

// 3. Create the Prompt Template
const quizPrompt = PromptTemplate.fromTemplate(`
You are a veteran UPSC Exam Setter. Your task is to create a high-quality Preliminary Exam quiz based ONLY on the provided context.

CONTEXT:
{context}

TOPIC: {topic}

INSTRUCTIONS:
1. Create 5 Multiple Choice Questions (MCQs).
2. Questions must be conceptual and statement-based (e.g., "Which of the following statements are correct?").
3. Distractors (wrong options) should be plausible.
4. Provide a detailed explanation for the correct answer.

{format_instructions}
`);

// 4. Build the Chain
export const quizGenerationChain = RunnableSequence.from([
  {
    topic: (input) => input.topic,
    context: (input) => input.context,
    format_instructions: () => parser.getFormatInstructions(),
  },
  quizPrompt,
  model,
  parser, // Automatically parses JSON string to Object
]);
