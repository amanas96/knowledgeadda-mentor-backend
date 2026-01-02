import app from "./src/app.js";
import config from "./src/config/index.js";
import { mentorService } from "./src/services/mentor/mentorService.js";

const startServer = async () => {
  try {
    console.log("🚀 Starting UPSC Mentor Service...");

    // 1. Initialize AI Services (Lazy load Vector DB connection)
    await mentorService.initialize();

    // 2. Start Express Server
    app.listen(config.app.port, () => {
      console.log(`\n✅ Server is running on port: ${config.app.port}`);
      console.log(
        `   - Health Check: http://localhost:${config.app.port}/health`
      );
      console.log(
        `   - Mentor API:   http://localhost:${config.app.port}/api/mentor/query`
      );
      console.log(
        `   - Upload API:   http://localhost:${config.app.port}/api/documents/upload\n`
      );
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
