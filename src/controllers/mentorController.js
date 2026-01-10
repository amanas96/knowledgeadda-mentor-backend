import { mentorService } from "../services/mentor/mentorService.js";
import { Chat } from "../models/chatModel.js";
import crypto from "crypto";

export const handleQuery = async (req, res) => {
  try {
    const { query } = req.body;

    const sessionId = req.body.sessionId || crypto.randomUUID();
    const user = req.user;

    // ✅ Debugging Logs (Check your terminal when you hit Send)
    console.log("-----------------------------------------");
    console.log("🔍 DEBUG CHECK:");
    console.log("req.user value:", req.user);
    console.log("Is User Undefined?", req.user === undefined);

    // ✅ STRICTER CHECK: User is guest if 'user' is missing OR 'user.id' is missing
    const isGuest = !user || !user.id;
    console.log("👉 FINAL VERDICT: isGuest =", isGuest);
    console.log("-----------------------------------------");

    let userId;
    if (isGuest) {
      userId = "guest_" + sessionId; // Unique ID for this guest session
    } else {
      userId = user.id.toString(); // Real Database ID
    }

    // ============================================================
    // 🔒 GUEST RESTRICTION LAYER
    // ============================================================
    if (isGuest) {
      console.log(`👤 Guest User detected: ${sessionId}`);

      // A. Feature Gate: Block Quizzes explicitly via Regex
      const isAskingForQuiz = /\b(quiz|test|mcq|mock|practice)\b/i.test(query);
      if (isAskingForQuiz) {
        return res.status(403).json({
          success: false,
          msg: "🔒 Premium Feature: Quizzes are for Registered Users only. Please Login!",
          isGuest: true,
        });
      }

      // B. Rate Limiting: Max 5 Messages per day
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today

      const messageCount = await Chat.countDocuments({
        sessionId: sessionId,
        createdAt: { $gte: today }, // Count messages since midnight
      });

      if (messageCount >= 10) {
        return res.status(403).json({
          success: false,
          msg: "🔒 Daily Guest Limit Reached (5/5). Please Login to continue chatting!",
          isGuest: true,
        });
      }
    } else {
      console.log(`✅ Registered User detected: ${user.email || userId}`);
    }

    // ============================================================
    // 🧠 AI PROCESSING
    // ============================================================
    console.log(`API: Processing query for session ${sessionId}`);

    // Call the AI Service
    const result = await mentorService.processQuery(userId, query, sessionId);

    // ============================================================
    // 🛡️ FINAL SAFEGUARD
    // ============================================================
    // If AI decided to generate a Quiz anyway (despite regex check), block it for guests.
    if (isGuest && result.type === "QUIZ") {
      return res.status(403).json({
        success: false,
        msg: "🔒 AI generated a Quiz, but this is a Premium feature. Please Login!",
        isGuest: true,
      });
    }

    // Success! Return the response
    res.json({
      success: true,
      sessionId: sessionId,
      ...result, // { type, data, sources }
      isGuest: isGuest,
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

export const getChatHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Fetch messages for this session, sorted by time (oldest first)
    const history = await Chat.find({ sessionId }).sort({ createdAt: 1 });

    res.json({ success: true, history });
  } catch (error) {
    console.error("History Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch history" });
  }
};
