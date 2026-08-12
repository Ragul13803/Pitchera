import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../database/db";
import { User, GoogleUserData, UserResponse } from "../types/user.types";

export class UserModel {
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute<(User & RowDataPacket)[]>(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    return rows[0] || null;
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const [rows] = await pool.execute<(User & RowDataPacket)[]>(
      "SELECT * FROM users WHERE google_id = ?",
      [googleId]
    );
    return rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const [rows] = await pool.execute<(User & RowDataPacket)[]>(
      "SELECT * FROM users WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  }

  static async createGoogleUser(userData: GoogleUserData): Promise<User> {
    const { email, googleId, firstName, lastName, avatarUrl } = userData;

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO users 
      (email, google_id, first_name, last_name, avatar_url, is_email_verified) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [email, googleId, firstName, lastName, avatarUrl, 1]
    );

    const user = await this.findById(result.insertId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  static async updateGoogleId(
    userId: number,
    googleId: string,
    avatarUrl?: string
  ): Promise<void> {
    await pool.query(
      `UPDATE users 
      SET google_id = ?, avatar_url = COALESCE(?, avatar_url), is_email_verified = 1
      WHERE id = ?`,
      [googleId, avatarUrl, userId]
    );
  }

  static async updateProfile(
    userId: number,
    data: { firstName?: string; lastName?: string; avatarUrl?: string }
  ): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.firstName) {
      updates.push("first_name = ?");
      values.push(data.firstName);
    }

    if (data.lastName) {
      updates.push("last_name = ?");
      values.push(data.lastName);
    }

    if (data.avatarUrl) {
      updates.push("avatar_url = ?");
      values.push(data.avatarUrl);
    }

    if (updates.length === 0) return;

    values.push(userId);

    await pool.execute(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values
    );
  }

  static toResponse(user: User): UserResponse {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      avatarUrl: user.avatar_url,
      isEmailVerified: Boolean(user.is_email_verified),
      isActive: Boolean(user.is_active),
    };
  }
}