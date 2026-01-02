import express from "express";
import multer from "multer";
import { uploadDocument } from "../controllers/documentController.js";

const router = express.Router();

// Configure temporary storage for uploads
const upload = multer({ dest: "uploads/" });

// POST /api/documents/upload
router.post("/upload", upload.single("pdf"), uploadDocument);

export default router;
