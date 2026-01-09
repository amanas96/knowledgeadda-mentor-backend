// import { v2 as cloudinary } from "cloudinary";
// import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
// import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
// import { getVectorStore } from "./retriever.js"; // ✅ Fixed Import
// import fs from "fs/promises";
// import dotenv from "dotenv";
// dotenv.config();

// // --- 1. Configure Cloudinary ---
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// class DocumentProcessor {
//   /**
//    * Processes a PDF: Uploads to Cloud, Splits Text, Indexes to Vector DB.
//    */
//   async processPDF(filePath, metadata = {}) {
//     try {
//       console.log(`Resource: Starting processing for ${filePath}...`);

//       // --- Step A: Upload to Cloudinary (Storage) ---
//       // This gives us a permanent URL to store in the vector DB
//       const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
//         resource_type: "auto",
//         folder: "upsc_materials",
//       });
//       console.log(
//         `☁️ Cloudinary Upload Success: ${cloudinaryResult.secure_url}`
//       );

//       // --- Step B: Load & Split PDF ---
//       const loader = new PDFLoader(filePath, { splitPages: false });
//       const rawDocs = await loader.load();
//       console.log(`Loader: Loaded ${rawDocs.length} raw document(s).`);

//       const splitter = new RecursiveCharacterTextSplitter({
//         chunkSize: 1000,
//         chunkOverlap: 200,
//         separators: ["\n\n", "\n", ".", "!", "?", ";", ",", " ", ""],
//         keepSeparator: true,
//       });

//       const chunkedDocs = await splitter.splitDocuments(rawDocs);

//       // --- Step C: Metadata Injection ---
//       // Crucial: We add the 'sourceUrl' so the frontend can display a "View PDF" link later
//       const docsWithMetadata = chunkedDocs.map((doc, index) => {
//         doc.metadata = {
//           ...doc.metadata,
//           ...metadata,
//           chunkIndex: index,
//           sourceUrl: cloudinaryResult.secure_url, // ✅ Link injected here
//           processedAt: new Date().toISOString(),
//         };
//         return doc;
//       });

//       console.log(`Splitter: Created ${docsWithMetadata.length} chunks.`);

//       // --- Step D: Index to Pinecone ---
//       const vectorStore = await getVectorStore(); // ✅ Corrected function name

//       // Upload in batches to prevent timeouts
//       const BATCH_SIZE = 50;
//       for (let i = 0; i < docsWithMetadata.length; i += BATCH_SIZE) {
//         const batch = docsWithMetadata.slice(i, i + BATCH_SIZE);
//         await vectorStore.addDocuments(batch);
//         console.log(
//           `Indexer: Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}`
//         );
//       }

//       // --- Step E: Cleanup ---
//       // Delete the local temp file (we have it on Cloudinary now)
//       try {
//         await fs.unlink(filePath);
//       } catch (e) {
//         console.warn("⚠️ Warning: Could not delete temp file:", e.message);
//       }

//       console.log("✅ Success: PDF processed and indexed.");

//       return {
//         success: true,
//         url: cloudinaryResult.secure_url,
//         chunks: docsWithMetadata.length,
//       };
//     } catch (error) {
//       console.error("❌ Document Processing Error:", error);
//       // Attempt cleanup even on error
//       try {
//         await fs.unlink(filePath);
//       } catch (e) {}
//       throw error;
//     }
//   }
// }

// export const documentProcessor = new DocumentProcessor();

/////////// New Approach Below ///////////

import { v2 as cloudinary } from "cloudinary";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { getVectorStore } from "./retriever.js";
import { Document } from "@langchain/core/documents";
import fs from "fs/promises";
import dotenv from "dotenv";
import { createRequire } from "module";

dotenv.config();

// --- 🛠️ THE FIX: Deep Import Strategy ---
const require = createRequire(import.meta.url);

// We force Node to load the internal file directly.
// This bypasses the weird "Module Object" wrapper you were seeing.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

class DocumentProcessor {
  async processPDF(filePath, metadata = {}) {
    try {
      console.log(`Resource: Starting processing for ${filePath}...`);

      // 🔍 Debug Check
      if (typeof pdfParse !== "function") {
        throw new Error(
          `CRITICAL: pdf-parse is still not a function. It is: ${typeof pdfParse}`
        );
      }

      // 1. Upload to Cloudinary
      const cloudinaryResult = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto",
        folder: "upsc_materials",
      });
      console.log(`☁️ Uploaded: ${cloudinaryResult.secure_url}`);

      // 2. Parse PDF Manually
      const pdfBuffer = await fs.readFile(filePath);

      // Execute the parser
      const pdfData = await pdfParse(pdfBuffer);

      console.log(`Parser: Extracted ${pdfData.text.length} characters.`);

      const rawDoc = new Document({
        pageContent: pdfData.text,
        metadata: {
          ...metadata,
          sourceUrl: cloudinaryResult.secure_url,
          totalPages: pdfData.numpages,
        },
      });

      // 3. Split Text
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
        separators: ["\n\n", "\n", ".", "!", "?", ";", ",", " ", ""],
      });

      const chunkedDocs = await splitter.splitDocuments([rawDoc]);

      const docsWithMetadata = chunkedDocs.map((doc, index) => {
        doc.metadata = {
          ...doc.metadata,
          chunkIndex: index,
          processedAt: new Date().toISOString(),
        };
        return doc;
      });

      // 4. Index to Vector Store
      const vectorStore = await getVectorStore();
      const BATCH_SIZE = 50;
      for (let i = 0; i < docsWithMetadata.length; i += BATCH_SIZE) {
        const batch = docsWithMetadata.slice(i, i + BATCH_SIZE);
        await vectorStore.addDocuments(batch);
        console.log(
          `Indexer: Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1}`
        );
      }

      // 5. Cleanup
      try {
        await fs.unlink(filePath);
      } catch (e) {}

      console.log("✅ Success: PDF processed and indexed.");

      return {
        success: true,
        url: cloudinaryResult.secure_url,
        chunks: docsWithMetadata.length,
      };
    } catch (error) {
      console.error("❌ Document Processing Error:", error);
      try {
        await fs.unlink(filePath);
      } catch (e) {}
      throw error;
    }
  }
}

export const documentProcessor = new DocumentProcessor();
