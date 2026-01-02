import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },

  // The User's input
  query: {
    type: String,
    required: true,
  },

  // The AI's output (can be text or a stringified JSON of the quiz)
  response: {
    type: mongoose.Schema.Types.Mixed, // Allows storing Object or String
    required: true,
  },

  // Classification of the interaction
  intent: {
    type: String,
    enum: ["QUIZ", "EXPLAIN", "UNKNOWN"],
    default: "EXPLAIN",
  },

  // Metadata for performance tracking (optional)
  tokensUsed: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    expires: "30d", // Optional: Auto-delete chat history after 30 days to save space
  },
});

export const Chat = mongoose.model("Chat", chatSchema);
