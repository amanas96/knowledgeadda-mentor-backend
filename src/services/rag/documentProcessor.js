import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { initVectorStore } from "./retriever.js";
import fs from "fs/promises";

class DocumentProcessor {
  /**
   * Processes a PDF file and indexes it into the Vector DB.
   * @param {string} filePath - Path to the uploaded PDF.
   * @param {string} metadata - (Optional) Extra info like 'Subject: History'.
   */
  async processPDF(filePath, metadata = {}) {
    try {
      console.log(`Resource: Starting processing for ${filePath}...`);

      // 1. Load the PDF
      // splitPages: false ensures we don't break mid-sentence across pages easily
      const loader = new PDFLoader(filePath, {
        splitPages: false,
      });
      const rawDocs = await loader.load();
      console.log(`Loader: Loaded ${rawDocs.length} raw document(s).`);

      // 2. Split Text (Architecture Section 6)
      // Optimized for UPSC content (dense text)
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000, // Sufficient for a coherent paragraph
        chunkOverlap: 200, // Maintains context overlap
        separators: ["\n\n", "\n", ".", "!", "?", ";", ",", " ", ""],
        keepSeparator: true,
      });

      const chunkedDocs = await splitter.splitDocuments(rawDocs);

      // 3. Enhance Metadata
      // Add source info so the AI knows where the info came from
      const docsWithMetadata = chunkedDocs.map((doc, index) => {
        doc.metadata = {
          ...doc.metadata,
          ...metadata,
          chunkIndex: index,
          processedAt: new Date().toISOString(),
        };
        return doc;
      });

      console.log(`Splitter: Created ${docsWithMetadata.length} chunks.`);

      // 4. Index to Pinecone
      const vectorStore = await initVectorStore();

      // Pinecone accepts arrays of documents
      // We process in batches of 50 to avoid timeouts
      const BATCH_SIZE = 50;
      for (let i = 0; i < docsWithMetadata.length; i += BATCH_SIZE) {
        const batch = docsWithMetadata.slice(i, i + BATCH_SIZE);
        await vectorStore.addDocuments(batch);
        console.log(
          `Indexer: Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}`
        );
      }

      // Cleanup: Delete temp file after processing
      await fs.unlink(filePath);

      console.log("✅ Success: PDF processed and indexed.");
      return { success: true, chunks: docsWithMetadata.length };
    } catch (error) {
      console.error("❌ Document Processing Error:", error);
      throw error;
    }
  }
}

export const documentProcessor = new DocumentProcessor();
