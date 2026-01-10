import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
dotenv.config();

// Import Routes
import mentorRoutes from "./routes/mentorRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";

const app = express();

// --- Middleware ---
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

// --- Routes ---
app.use("/api/mentor", mentorRoutes);
app.use("/api/documents", documentRoutes);

// --- Health Check ---
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something broke!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

export default app;
