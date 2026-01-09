import express from "express";
import { handleChat } from "../controllers/chatController.js";
import protect from "../middlewares/auth.js";

const router = express.Router();

// POST /api/mentor/chat
router.post("/chat", handleChat);

export default router;
