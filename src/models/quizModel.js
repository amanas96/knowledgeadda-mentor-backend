import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  topic: {
    type: String,
    required: true,
    trim: true,
  },
  questions: [
    {
      questionText: { type: String, required: true },
      options: {
        type: [String],
        validate: [arrayLimit, "{PATH} must have exactly 4 options"],
      },
      correctAnswer: { type: String, required: true },
      explanation: { type: String },
    },
  ],
  // Optional: If you want to store the user's score later
  userScore: {
    type: Number,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

function arrayLimit(val) {
  return val.length === 4;
}

export const Quiz = mongoose.model("Quiz", quizSchema);
