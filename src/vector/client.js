import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import dotenv from "dotenv";
dotenv.config();

export const getVectorStore = async () => {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    modelName: "embedding-001",
    apiKey: process.env.GOOGLE_API_KEY,
  });

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX);

  return await PineconeStore.fromExistingIndex(embeddings, { pineconeIndex });
};
