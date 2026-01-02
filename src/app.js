import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

// Import Routes
import mentorRoutes from "./routes/mentor.routes.js";
import documentRoutes from "./routes/document.routes.js";

const app = express();

// --- Middleware ---
app.use(helmet()); // Security headers
app.use(cors()); // Allow frontend requests
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // Logger

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
