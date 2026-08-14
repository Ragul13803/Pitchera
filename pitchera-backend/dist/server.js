"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const db_1 = require("./database/db");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
async function start() {
    // Ensure upload directories exist
    const uploadDirs = ["resumes", "photos", "attachments"].map((dir) => path_1.default.join(env_1.env.uploadDir, dir));
    for (const dir of uploadDirs) {
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
    }
    // Test DB connection
    await (0, db_1.testConnection)();
    app_1.default.listen(env_1.env.port, "0.0.0.0", () => {
        console.log(`🚀 Pitchera API running on port http://localhost:${env_1.env.port}`);
        console.log(`📍 Environment: ${env_1.env.nodeEnv}`);
        console.log(`🌐 Frontend URL: ${env_1.env.frontendUrl}`);
        // Show LAN IP addresses
        const interfaces = os_1.default.networkInterfaces();
        console.log("\n🌐 Available network URLs:");
        for (const [name, addresses] of Object.entries(interfaces)) {
            for (const address of addresses ?? []) {
                if (address.family === "IPv4" && !address.internal) {
                    console.log(`  ${name}: http://${address.address}:${env_1.env.port}`);
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
//# sourceMappingURL=server.js.map