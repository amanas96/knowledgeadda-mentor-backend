import { mentorService } from "../services/mentor/mentorService.js";
import crypto from "crypto";

export const handleQuery = async (req, res) => {
  try {
    const { query, sessionId } = req.body;

    // Basic validation
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    // Generate a session ID if one isn't provided (for guest users)
    const activeSessionId = sessionId || crypto.randomUUID();

    // Simulate User ID (In production, this comes from req.user via Auth Middleware)
    const userId = "guest_user";

    console.log(`API: Received query for session ${activeSessionId}`);

    // Call the AI Orchestrator
    const result = await mentorService.processQuery(
      userId,
      query,
      activeSessionId
    );

    // Return structured response
    res.json({
      success: true,
      sessionId: activeSessionId,
      ...result,
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
