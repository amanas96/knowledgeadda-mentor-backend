import express from "express";
import { handleQuery } from "../controllers/mentorController.js";

const router = express.Router();

// POST /api/mentor/query
// Body: { "query": "Explain Article 21", "sessionId": "optional-uuid" }
router.post("/query", handleQuery);

export default router;
