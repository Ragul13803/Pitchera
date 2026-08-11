import mysql from "mysql2/promise";
import { env } from "../config/env";

const pool = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: "+00:00",
  charset: "utf8mb4",
});

export async function testConnection(): Promise<void> {
  const connection = await pool.getConnection();
  await connection.ping();
  connection.release();
  console.log("✅ Database connected successfully");
}

export { pool };
export default pool;