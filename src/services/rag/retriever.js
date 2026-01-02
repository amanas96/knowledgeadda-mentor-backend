import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/community/vectorstores/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import config from "../../config/index.js";

let vectorStoreInstance = null;

export const initVectorStore = async () => {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  try {
    // 1. Initialize Pinecone Client
    const pinecone = new Pinecone({
      apiKey: config.vectorDB.apiKey,
    });

    const pineconeIndex = pinecone.Index(config.vectorDB.indexName);

    // 2. Initialize Embeddings (Architecture Recommendation 3)
    const embeddings = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small", // 1536 dimensions, highly efficient
      openAIApiKey: config.llm.openaiApiKey,
    });

    // 3. Connect to existing Pinecone Index
    vectorStoreInstance = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      maxConcurrency: 5, // Optimized for serverless
    });

    console.log("✅ Vector Store connected: Pinecone Serverless");
    return vectorStoreInstance;
  } catch (error) {
    console.error("❌ Failed to init Vector Store:", error);
    throw error;
  }
};
