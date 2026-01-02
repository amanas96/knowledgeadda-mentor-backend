// mentorService/config/vectorStore.js
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { pineconeIndex } from "./pinecone.js";

// Validate environment variables
if (!process.env.GOOGLE_API_KEY && !process.env.OPENAI_API_KEY) {
  throw new Error("Either GOOGLE_API_KEY or OPENAI_API_KEY must be set");
}

/**
 * Initialize embeddings based on configuration
 * Google: Free but lower quality
 * OpenAI: Paid but higher quality and more dimensions
 */
const initializeEmbeddings = () => {
  const embeddingProvider = process.env.EMBEDDING_PROVIDER || "google";

  if (embeddingProvider === "openai") {
    console.log("📊 Using OpenAI Embeddings (text-embedding-3-small)");
    return new OpenAIEmbeddings({
      modelName: "text-embedding-3-small", // 1536 dimensions
      apiKey: process.env.OPENAI_API_KEY,
      batchSize: 512, // Process multiple texts at once
      stripNewLines: true,
    });
  } else {
    console.log("📊 Using Google Embeddings (text-embedding-004)");
    return new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004", // ✅ Latest model (768 dimensions)
      apiKey: process.env.GOOGLE_API_KEY,
      taskType: "retrieval_document", // Optimized for RAG
    });
  }
};

export const embeddings = initializeEmbeddings();

/**
 * Get retriever with advanced configuration
 */
export const getRetriever = async (options = {}) => {
  try {
    const {
      topK = 5,
      namespace = undefined, // Optional: Filter by namespace (subject)
      searchType = "similarity", // 'similarity' or 'mmr'
      filter = undefined, // Metadata filter
      lambda = 0.5, // MMR diversity (0-1, higher = more diverse)
    } = options;

    // Create vector store from existing Pinecone index
    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
      textKey: "text",
      filter,
    });

    // Configure retriever based on search type
    if (searchType === "mmr") {
      // MMR (Maximum Marginal Relevance) - for diverse results
      return vectorStore.asRetriever({
        searchType: "mmr",
        searchKwargs: {
          k: topK,
          fetchK: topK * 3, // Fetch more candidates for diversity
          lambda, // Balance relevance vs diversity
        },
      });
    } else {
      // Standard similarity search
      return vectorStore.asRetriever({
        searchType: "similarity",
        searchKwargs: {
          k: topK,
          filter,
        },
      });
    }
  } catch (error) {
    console.error("❌ Error creating retriever:", error.message);
    throw new Error(`Failed to initialize retriever: ${error.message}`);
  }
};

/**
 * Get vector store for direct operations (upsert, delete, etc.)
 */
export const getVectorStore = async (namespace = undefined) => {
  try {
    return await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
      textKey: "text",
    });
  } catch (error) {
    console.error("❌ Error creating vector store:", error.message);
    throw error;
  }
};

/**
 * Search with custom query
 */
export const searchDocuments = async (query, options = {}) => {
  try {
    const {
      topK = 5,
      namespace = undefined,
      filter = undefined,
      scoreThreshold = 0.7, // Minimum relevance score
    } = options;

    const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex,
      namespace,
      textKey: "text",
    });

    // Perform similarity search with scores
    const results = await vectorStore.similaritySearchWithScore(
      query,
      topK,
      filter
    );

    // Filter by score threshold and format results
    const relevantDocs = results
      .filter(([doc, score]) => score >= scoreThreshold)
      .map(([doc, score]) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
        score: score,
      }));

    console.log(`✅ Found ${relevantDocs.length}/${topK} relevant documents`);

    return relevantDocs;
  } catch (error) {
    console.error("❌ Search error:", error.message);
    throw error;
  }
};

/**
 * Test retriever connection
 */
export const testRetriever = async () => {
  try {
    console.log("🧪 Testing retriever...");

    const retriever = await getRetriever({ topK: 1 });
    const results = await retriever.getRelevantDocuments("test query");

    console.log("✅ Retriever test passed");
    console.log(
      "📄 Sample result:",
      results[0]?.pageContent?.substring(0, 100)
    );

    return true;
  } catch (error) {
    console.error("❌ Retriever test failed:", error.message);
    return false;
  }
};

export default { embeddings, getRetriever, getVectorStore, searchDocuments };
