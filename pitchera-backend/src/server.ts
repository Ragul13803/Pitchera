import app from "./app";
import { env } from "./config/env";
import { testConnection } from "./database/db";
import { startEmailScheduler } from "./jobs/emailScheduler";
import fs from "fs";
import path from "path";
import os from "os";
import { startCleanupJob } from "./jobs/cleanupJob";

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
    console.log(
      `🚀 Pitchera API running on port http://localhost:${env.port}/api`
    );
    console.log(`📍 Environment: ${env.nodeEnv}`);
    console.log(`🌐 Frontend URL: ${env.frontendUrl}`);

    startEmailScheduler();
    startCleanupJob();

    const interfaces = os.networkInterfaces();

    console.log("\n🌐 Available network URLs:");

    for (const [name, addresses] of Object.entries(interfaces)) {
      // Ignore Docker interfaces
      if (
        name.startsWith("br-") ||
        name.startsWith("docker") ||
        name.startsWith("veth")
      ) {
        continue;
      }

      for (const address of addresses ?? []) {
        // Ignore loopback/internal interfaces
        if (address.internal) {
          continue;
        }

        // IPv4
        if (address.family === "IPv4") {
          console.log(
            `  ${name} (IPv4): http://${address.address}:${env.port}/api`
          );
        }

        // IPv6
        if (address.family === "IPv6") {
          console.log(
            `  ${name} (IPv6): http://[${address.address}]:${env.port}/api`
          );
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