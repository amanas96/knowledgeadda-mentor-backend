import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    // --- 1. Identity & Session ---
    // We use String to allow both Real IDs and Guest IDs
    userId: {
      type: String,
      required: true,
      index: true, // ⚡ Critical for fast Rate Limiting checks
    },
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },

    // --- 2. The Conversation ---
    query: {
      type: String,
      required: true,
    },
    response: {
      type: String, // Stores the explanation text OR the JSON Quiz string
      required: true,
    },

    // --- 3. AI Metadata ---
    intent: {
      type: String,
      enum: ["QUIZ", "EXPLAIN", "CONVERSATION", "UNCLEAR"], // Helps with analytics
      default: "EXPLAIN",
    },

    // Citations (Where did the AI get the answer?)
    sources: [
      {
        title: String,
        url: String,
      },
    ],
  },
  {
    timestamps: true,
    collection: "mentor_chats",
  }
);

export const Chat = mongoose.model("Chat", chatSchema);
