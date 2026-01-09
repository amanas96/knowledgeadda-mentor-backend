import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone"; // ✅ Your stability fix
import { pineconeIndex } from "../../config/pinecone.js";
import dotenv from "dotenv";
dotenv.config();

// --- 1. Initialize Embeddings Strategy ---
const initializeEmbeddings = () => {
  const embeddingProvider = process.env.EMBEDDING_PROVIDER || "google";

  if (embeddingProvider === "openai") {
    console.log("📊 Using OpenAI Embeddings (High Precision)");
    return new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 512,
    });
  } else {
    console.log("📊 Using Google Embeddings (Cost Effective)");
    return new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004",
      apiKey: process.env.GOOGLE_API_KEY,
      taskType: "retrieval_document",
    });
  }
};

export const embeddings = initializeEmbeddings();

// --- 2. The Smart Retriever (MMR & Filtering) ---
export const getRetriever = async (options = {}) => {
  try {
    const {
      topK = 5,
      namespace = undefined,
      searchType = "mmr", // Default to Diversity search
      filter = undefined,
    } = options;

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
      textKey: "text",
      filter,
    });

    if (searchType === "mmr") {
      // MMR ensures we don't get 5 versions of the same paragraph
      return vectorStore.asRetriever({
        searchType: "mmr",
        k: topK,
        searchKwargs: {
          fetchK: topK * 4,
          lambda: 0.5,
        },
      });
    } else {
      return vectorStore.asRetriever({
        searchType: "similarity",
        k: topK,
        filter,
      });
    }
  } catch (error) {
    console.error("❌ Retriever Init Error:", error.message);
    throw new Error("Failed to initialize RAG retriever");
  }
};

// --- 3. Direct Store Access (For Uploads) ---
export const getVectorStore = async () => {
  return await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    textKey: "text",
  });
};
