import app from "./app";
import { env } from "./config/env";
import { testConnection } from "./database/db";
import fs from "fs";
import path from "path";
import os from "os";

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Pitchera Working Fine!!",
  });
});

app.get("/health", (req, res) => {
  res.json({
    message: "Pitchera Service is Running!!",
  });
});

async function start(): Promise<void> {
  // Ensure upload directories exist
  const uploadDirs = ["resumes", "photos", "attachments"].map((dir) =>
    path.join(env.uploadDir, dir)
  );

  for (const dir of uploadDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  // Test DB connection
  await testConnection();

  app.listen(env.port, "0.0.0.0", () => {
    console.log(`🚀 Pitchera API running on port ${env.port}`);
    console.log(`📍 Environment: ${env.nodeEnv}`);
    console.log(`🌐 Frontend URL: ${env.frontendUrl}`);

    // Show LAN IP addresses
    const interfaces = os.networkInterfaces();

    console.log("\n🌐 Available network URLs:");

    for (const [name, addresses] of Object.entries(interfaces)) {
      for (const address of addresses ?? []) {
        if (address.family === "IPv4" && !address.internal) {
          console.log(`  ${name}: http://${address.address}:${env.port}`);
        }
      }
    }

    console.log("");
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});