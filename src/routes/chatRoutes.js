import { handleChat } from "../controllers/chatController";

import { protect } from "../middlewares/auth.js";
import express from "express";

const router = express.Router();

router.post("/chat", protect, handleChat);

router.get("/status", (req, res) => res.json({ status: "AI Service Online" }));

export default router;
