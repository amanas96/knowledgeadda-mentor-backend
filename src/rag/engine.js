import { routerChain, quizChain, explainChain } from "./chains.js";
import { getVectorStore } from "../vector/client.js";

export const generateResponse = async (query) => {
  // 1. Router
  const intentRaw = await routerChain.invoke({ query });
  const intent = intentRaw.toUpperCase().includes("QUIZ") ? "QUIZ" : "EXPLAIN";

  // 2. Retrieval
  const vectorStore = await getVectorStore();
  const retriever = vectorStore.asRetriever(3);
  const contextDocs = await retriever.invoke(query);
  const contextText = contextDocs.map((d) => d.pageContent).join("\n");

  // 3. Generation
  if (intent === "QUIZ") {
    const result = await quizChain.invoke({ context: contextText, query });
    // Add logic here to parse JSON safely
    return {
      type: "QUIZ",
      data: JSON.parse(result.replace(/```json|```/g, "")),
    };
  } else {
    const result = await explainChain.invoke({ context: contextText, query });
    return { type: "TEXT", data: result };
  }
};
