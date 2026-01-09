import express from "express";
import multer from "multer";
import { uploadDocument } from "../controllers/documentController.js";
import fs from "fs";

const router = express.Router();

// 1. Ensure 'uploads' directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// 2. Configure Multer (Temporary storage)
const upload = multer({ dest: uploadDir });

// 3. Define Route with Middleware
// IMPORTANT: 'upload.single('pdf')' MUST be here.
// It tells Express: "Expect a file in the field named 'pdf'"
router.post("/upload", upload.single("pdf"), uploadDocument);

export default router;
