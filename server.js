import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("🚀 Starting UPSC Mentor Service...");

    // 1. Connect to Database
    await connectDB();

    // 2. Start Express Server
    // Note: mentorService does not need explicit initialization anymore.
    app.listen(PORT, () => {
      console.log(`\n✅ Server is running on port: ${PORT}`);
      console.log(
        `   - Mentor API:   http://localhost:${PORT}/api/mentor/query`
      );
      console.log(
        `   - Upload API:   http://localhost:${PORT}/api/documents/upload\n`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
