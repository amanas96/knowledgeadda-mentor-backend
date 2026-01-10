import { Chat } from "../../models/chatModel.js";
import { quizGenerationChain } from "../llm/quizGenerator.js";
import { explanationChain } from "../llm/explanationGenerator.js";
import { getRetriever } from "../rag/retriever.js";
import { intentClassifierChain } from "../llm/intentClassifier.js";
import { optimizeQuery } from "../llm/queryProcessor.js";

// --- 1. Fast Regex Logic (Intent) ---
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

  return { type: "UNCLEAR", confidence: 0.4 };
};

// --- 2. General Chat Logic (New Helper) ---
const isGeneralChat = (text) => {
  // Checks for greetings or "help" questions, but only if they are short sentences
  const greetings =
    /\b(hi|hello|hey|greetings|morning|afternoon|thanks|thank you)\b/i;
  const help = /\b(help|can you do|features|capabilities|who are you)\b/i;

  return (
    (greetings.test(text) || help.test(text)) && text.split(" ").length < 10
  );
};

class UPSCMentorService {
  async processQuery(userId, query, sessionId) {
    // ==========================================================
    // STEP 1: HYBRID INTENT DETECTION
    // ==========================================================
    let intent = "EXPLAIN"; // Default

    const quickResult = quickIntentCheck(query);

    if (quickResult.confidence >= 0.7) {
      intent = quickResult.type;
      console.log(`⚡ Intent (Regex): ${intent}`);
    } else {
      try {
        console.log(`🤔 Intent Unclear. Asking LLM...`);
        const llmResult = await intentClassifierChain.invoke({ query });
        intent = llmResult.trim().toUpperCase().includes("QUIZ")
          ? "QUIZ"
          : "EXPLAIN";
        console.log(`🤖 Intent (LLM): ${intent}`);
      } catch (err) {
        console.error("Intent Fallback Failed:", err);
        intent = "EXPLAIN";
      }
    }

    // ==========================================================
    // STEP 2: CONTEXT RETRIEVAL (With Optimization & General Chat Check)
    // ==========================================================
    let contextText = "";
    let sources = [];

    // ✅ CHECK: If it's just "Hi", skip the expensive DB search
    if (intent === "EXPLAIN" && isGeneralChat(query)) {
      console.log(
        "💬 General Chat detected (Skipping DB Search & Optimization)"
      );
      // contextText remains empty "", forcing LLM to use its own knowledge
    } else {
      // It is a real question or a quiz topic. Let's Optimize & Search!
      try {
        // A. Optimize the Query (Rephrasing)
        console.log(`📝 Original Query: "${query}"`);
        const searchQuery = await optimizeQuery(query);
        console.log(`✨ Optimized Search Query: "${searchQuery}"`);

        // B. Search Database with Optimized Query
        const retriever = await getRetriever({ topK: 4 });
        const docs = await retriever.invoke(searchQuery); // Use optimized query here

        if (docs.length > 0) {
          console.log(`✅ Found ${docs.length} relevant docs.`);
          contextText = docs.map((d) => d.pageContent).join("\n\n");
          sources = docs.map((d) => ({
            title: d.metadata.source || "UPSC Material",
            url: d.metadata.sourceUrl || null,
          }));
        } else {
          console.log("⚠️ No relevant docs found in DB.");
        }
      } catch (error) {
        console.error("⚠️ Retrieval Pipeline Failed:", error.message);
        // Continue with empty context so the app doesn't crash
      }
    }

    // ==========================================================
    // STEP 3: GENERATE RESPONSE
    // ==========================================================
    let result;
    if (intent === "QUIZ") {
      result = await quizGenerationChain.invoke({
        topic: query, // Use original query for topic name
        context: contextText,
        chat_history: [],
      });
    } else {
      result = await explanationChain.invoke({
        question: query, // Use original query for natural conversation
        context: contextText,
        chat_history: [],
      });
    }

    // ==========================================================
    // STEP 4: SAVE HISTORY
    // ==========================================================
    await Chat.create({
      userId,
      sessionId,
      query,
      response: typeof result === "string" ? result : JSON.stringify(result),
      intent,
      sources,
      isGuest: userId.startsWith("guest_"),
    });

    return { type: intent, data: result, sources };
  }
}

export const mentorService = new UPSCMentorService();
