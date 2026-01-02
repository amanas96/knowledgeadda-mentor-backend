import { BufferWindowMemory } from "langchain/memory";
import { intentClassifierChain } from "../llm/intentClassifier.js"; // To be implemented next
import { queryEnhancerChain } from "../llm/queryEnhancer.js"; // To be implemented next
import { quizGenerationChain } from "../llm/quizGenerator.js"; // To be implemented next
import { explanationChain } from "../llm/explanationGenerator.js"; // To be implemented next
import { initVectorStore } from "../rag/retriever.js"; // To be implemented next

class UPSCMentorService {
  constructor() {
    this.vectorStore = null;
    this.memories = new Map(); // Simple in-memory session storage
  }

  async initialize() {
    // Lazy load vector store connection
    this.vectorStore = await initVectorStore();
    console.log("UPSCMentorService: Initialized successfully");
  }

  // Helper to manage session memory (Architecture Section 8)
  getSessionMemory(sessionId) {
    if (!this.memories.has(sessionId)) {
      this.memories.set(
        sessionId,
        new BufferWindowMemory({
          k: 5, // Keep last 5 exchanges
          returnMessages: true,
          memoryKey: "chat_history",
          inputKey: "question",
          outputKey: "answer",
        })
      );
    }
    return this.memories.get(sessionId);
  }

  async processQuery(userId, query, sessionId) {
    try {
      const memory = this.getSessionMemory(sessionId);

      // --- Step 1: Intent Classification (Architecture Section 7) ---
      // We use a fast Rule-Based check first, then fallback to LLM
      let intentObj = this.quickIntentCheck(query);

      if (intentObj.confidence < 0.7) {
        console.log(`Intent unclear (${intentObj.confidence}), asking LLM...`);
        // intentObj = await intentClassifierChain.invoke({ query });
        // Placeholder for LLM call
        intentObj = { type: "explanation", confidence: 0.9 }; // Default fallback
      }

      console.log(`Detected Intent: ${intentObj.type}`);

      // --- Step 2: Query Enhancement (Architecture Section 5) ---
      // Reformulate user query to be "Search Engine Friendly" for the Vector DB
      // const enhancedQuery = await queryEnhancerChain.invoke({ query });
      const enhancedQuery = query; // Bypass for initial test

      // --- Step 3: Routing ---
      if (intentObj.type === "quiz") {
        return await this.handleQuizFlow(enhancedQuery, memory, sessionId);
      } else {
        return await this.handleExplanationFlow(
          enhancedQuery,
          memory,
          sessionId
        );
      }
    } catch (error) {
      console.error("Error in Mentor Service:", error);
      return {
        success: false,
        message: "I encountered a processing error. Please try again.",
        error: error.message,
      };
    }
  }

  // --- Logic Flows ---

  async handleQuizFlow(query, memory, sessionId) {
    // 1. Retrieve Context
    const contextDocs = await this.vectorStore.similaritySearch(query, 5);
    const contextText = contextDocs.map((d) => d.pageContent).join("\n");

    // 2. Generate Quiz using Gemini 1.5 Flash
    // const quiz = await quizGenerationChain.invoke({ topic: query, context: contextText });

    // Mock response for now
    return {
      type: "quiz",
      sessionId,
      data: {
        topic: query,
        questions: [
          { id: 1, text: "Sample Question?", options: ["A", "B", "C", "D"] },
        ],
      },
    };
  }

  async handleExplanationFlow(query, memory, sessionId) {
    // 1. RAG Retrieval with MMR (Architecture Section 5)
    // Note: In real impl, we use the retriever logic here
    const contextDocs = await this.vectorStore.similaritySearch(query, 4);

    // 2. Generate Answer using Llama 3 70B
    // const response = await explanationChain.invoke({
    //   question: query,
    //   context: contextDocs,
    //   chat_history: await memory.loadMemoryVariables({})
    // });

    // Mock response
    const answer = "This is a placeholder explanation based on UPSC context.";

    // 3. Update Memory
    await memory.saveContext({ question: query }, { answer: answer });

    return {
      type: "explanation",
      data: {
        answer: answer,
        sources: contextDocs.map((d) => d.metadata.source || "Unknown"),
      },
    };
  }

  // Fast Regex based intent check (Architecture Section 7)
  quickIntentCheck(query) {
    const quizKeywords = /\b(quiz|test|mcq|questions?|practice|mock)\b/i;
    const explainKeywords =
      /\b(explain|what|how|why|describe|define|elaborate)\b/i;

    if (quizKeywords.test(query)) return { type: "quiz", confidence: 0.8 };
    if (explainKeywords.test(query))
      return { type: "explain", confidence: 0.7 };
    return { type: "unclear", confidence: 0.4 };
  }
}

export const mentorService = new UPSCMentorService();
