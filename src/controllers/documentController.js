import { documentProcessor } from "../services/rag/documentProcessor.js";

export const uploadDocument = async (req, res) => {
  console.log("📨 Header Content-Type:", req.headers["content-type"]);
  console.log("📥 Request Body:", req.body);
  console.log("📂 Request File:", req.file);
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file provided" });
    }

    const { subject, year } = req.body; // metadata from form-data

    // Pass the temp file path from multer to the processor
    const result = await documentProcessor.processPDF(req.file.path, {
      subject: subject || "General",
      year: year || "N/A",
    });

    res.json({
      message: "Document successfully ingested",
      stats: result,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to process document", details: error.message });
  }
};
