import express from "express";
import {
  handleQuery,
  getChatHistory,
} from "../controllers/mentorController.js";
const router = express.Router();

// POST /api/mentor/chat
router.post("/chat", handleQuery);
router.get("/history/:sessionId", getChatHistory);

export default router;
