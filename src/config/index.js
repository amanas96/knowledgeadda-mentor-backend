import dotenv from "dotenv";
dotenv.config();

const config = {
  app: {
    port: process.env.PORT || 8000,
    env: process.env.NODE_ENV || "development",
  },
  llm: {
    groqApiKey: process.env.GROQ_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY, // Mostly for embeddings
    models: {
      intent: process.env.INTENT_MODEL || "llama3-8b-8192", // Fast & Cheap
      explanation: process.env.EXPLANATION_MODEL || "llama3-70b-8192", // High Intelligence
      quiz: process.env.QUIZ_MODEL || "gemini-1.5-flash", // Structured Output Expert
    },
  },
  vectorDB: {
    apiKey: process.env.PINECONE_API_KEY,
    indexName: process.env.PINECONE_INDEX,
  },
};

export default config;
