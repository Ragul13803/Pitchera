"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.testConnection = testConnection;
const promise_1 = __importDefault(require("mysql2/promise"));
const env_1 = require("../config/env");
const pool = promise_1.default.createPool({
    host: env_1.env.database.host,
    port: env_1.env.database.port,
    user: env_1.env.database.user,
    password: env_1.env.database.password,
    database: env_1.env.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "+00:00",
    charset: "utf8mb4",
});
exports.pool = pool;
async function testConnection() {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("✅ Database connected successfully");
}
exports.default = pool;
//# sourceMappingURL=db.js.map