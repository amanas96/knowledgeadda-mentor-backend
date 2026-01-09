import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";

// 1. Load environment variables explicitly here
dotenv.config();

const apiKey = process.env.PINECONE_API_KEY;
const indexName = process.env.PINECONE_INDEX_NAME;

// 2. Debug Log (So you know it's working)
if (!apiKey || !indexName) {
  console.error(
    "❌ PINECONE CONFIG ERROR: Missing API Key or Index Name in .env"
  );
  // Don't crash immediately, but warn loudly.
} else {
  console.log(`🌲 Pinecone Initialized. Target Index: '${indexName}'`);
}

// 3. Initialize Client
const pinecone = new Pinecone({
  apiKey: apiKey,
});

// 4. Export the specific index instance
export const pineconeIndex = pinecone.Index(indexName);
