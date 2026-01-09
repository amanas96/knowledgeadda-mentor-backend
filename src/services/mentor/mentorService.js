import { Chat } from "../../models/chatModel.js";
import { quizGenerationChain } from "../llm/quizGenerator.js";
import { explanationChain } from "../llm/explanationGenerator.js";
import { getRetriever } from "../rag/retriever.js";
import { intentClassifierChain } from "../llm/intentClassifier.js"; // ✅ Re-added valid import

// --- 1. Fast Regex Logic ---
const quickIntentCheck = (query) => {
  const lower = query.toLowerCase();

  const quizPatterns = [
    /\b(quiz|test|mcq|mock|practice)\b/i,
    /give.*questions/i,
  ];
  const explainPatterns = [/\b(explain|define|what is|how to|describe)\b/i];

  if (quizPatterns.some((p) => p.test(lower)))
    return { type: "QUIZ", confidence: 0.9 };
  if (explainPatterns.some((p) => p.test(lower)))
    return { type: "EXPLAIN", confidence: 0.8 };

  return { type: "UNCLEAR", confidence: 0.4 }; // Low confidence triggers LLM
};

class UPSCMentorService {
  async processQuery(userId, query, sessionId) {
    // --- Step 1: Hybrid Intent Detection ---
    let intent = "EXPLAIN"; // Default

    // A. Try Regex
    const quickResult = quickIntentCheck(query);

    if (quickResult.confidence >= 0.7) {
      intent = quickResult.type;
      console.log(`⚡ Intent (Regex): ${intent}`);
    } else {
      // B. Fallback to LLM (The logic you asked for)
      try {
        console.log(`🤔 Intent Unclear. Asking LLM...`);
        const llmResult = await intentClassifierChain.invoke({ query });
        intent = llmResult.trim().toUpperCase().includes("QUIZ")
          ? "QUIZ"
          : "EXPLAIN";
        console.log(`🤖 Intent (LLM): ${intent}`);
      } catch (err) {
        console.error("Intent Fallback Failed:", err);
        intent = "EXPLAIN"; // Safety net
      }
    }

    // --- Step 2: Retrieve Context ---
    const retriever = await getRetriever({ topK: 4 });
    const docs = await retriever.invoke(query);
    const contextText = docs.map((d) => d.pageContent).join("\n\n");

    const sources = docs.map((d) => ({
      title: d.metadata.source || "UPSC Material",
      url: d.metadata.sourceUrl || null,
    }));

    // --- Step 3: Route & Generate ---
    let result;
    if (intent === "QUIZ") {
      result = await quizGenerationChain.invoke({
        topic: query,
        context: contextText,
        chat_history: [],
      });
    } else {
      result = await explanationChain.invoke({
        question: query,
        context: contextText,
        chat_history: [],
      });
    }

    // --- Step 4: Save History ---
    await Chat.create({
      userId,
      sessionId,
      query,
      response: typeof result === "string" ? result : JSON.stringify(result),
      intent,
      sources,
    });

    return { type: intent, data: result, sources };
  }
}

export const mentorService = new UPSCMentorService();
