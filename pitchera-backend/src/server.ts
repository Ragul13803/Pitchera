import app from "./app";
import { env } from "./config/env";
import { testConnection } from "./database/db";
import fs from "fs";
import path from "path";
import os from "os";
import { startScheduler, stopScheduler } from "./services/scheduler.service";

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

  const server = app.listen(env.port, "0.0.0.0", () => {
    console.log(`🚀 Pitchera API running on port http://localhost:${env.port}`);
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

    startScheduler();
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    stopScheduler();

    server.close((err) => {
      if (err) {
        console.error("❌ Error while closing server:", err);
        process.exit(1);
      }

      console.log("✅ Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});