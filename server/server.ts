console.log("🚀 Starting server...");

import app from "./src/app";
import dotenv from "dotenv";
import connectToDatabase from "./src/config/db";

dotenv.config();

const startServer = async () => {
  try {
    console.log("Starting server...");
    await connectToDatabase();

    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`🚀 Server running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error("❌ Error starting server:", err);
    process.exit(1);
  }
};

startServer();
