import { mentorService } from "../services/mentor/mentorService.js"; // ✅ Point to the new Service
import crypto from "crypto";

export const handleChat = async (req, res) => {
  try {
    const { query, sessionId } = req.body;

    // 1. Basic Validation
    if (!query) {
      return res.status(400).json({ success: false, msg: "Query required" });
    }

    // 2. Get User Context (From your Auth Middleware)
    // If middleware worked, req.user exists. If guest, fallback to 'guest_user'.
    const userId = req.user ? req.user._id : "guest_user";

    // 3. Manage Session (Critical for Contextual Memory)
    // If frontend sends a sessionId, use it. Otherwise, create a new one.
    const activeSessionId = sessionId || crypto.randomUUID();

    // 4. Call the AI Brain
    // This single function now handles Intent, Retrieval, Generation, and DB Logging
    const result = await mentorService.processQuery(
      userId,
      query,
      activeSessionId
    );

    // 5. Send Response
    res.status(200).json({
      success: true,
      sessionId: activeSessionId, // Send back so frontend can reuse it
      response: result, // Contains { type: 'QUIZ'|'EXPLAIN', data: ..., sources: ... }
    });
  } catch (error) {
    console.error("Chat Controller Error:", error);
    res.status(500).json({
      success: false,
      msg: "AI Service Error",
      error: error.message,
    });
  }
};
