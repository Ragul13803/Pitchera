import bcrypt from "bcrypt";
import crypto from "crypto";
import pool from "../database/db";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const SALT_ROUNDS = 12;

interface User extends RowDataPacket {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string | null;
  google_id: string | null;
  avatar_url: string | null;
  is_active: number;
  is_email_verified: number;
}

export async function registerUser(
  firstName: string,
  lastName: string,
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; user: object }> {
  const [existing] = await pool.query<User[]>(
    "SELECT id FROM users WHERE email = ?",
    [email.toLowerCase()]
  );

  if (existing.length > 0) {
    throw new Error("Email already registered");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)`,
    [firstName, lastName, email.toLowerCase(), passwordHash]
  );

  const userId = result.insertId;

  // Create empty profile
  await pool.query("INSERT INTO profiles (user_id) VALUES (?)", [userId]);

  // Create empty social links
  await pool.query("INSERT INTO social_links (user_id) VALUES (?)", [userId]);

  // Create default email template
  await createDefaultTemplate(userId);

  const tokens = await createSession(userId, email.toLowerCase());

  return {
    ...tokens,
    user: {
      id: userId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      isEmailVerified: false,
    },
  };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string; user: object }> {
  const [users] = await pool.query<User[]>(
    "SELECT * FROM users WHERE email = ? AND is_active = 1",
    [email.toLowerCase()]
  );

  if (users.length === 0) {
    throw new Error("Invalid email or password");
  }

  const user = users[0];

  if (!user.password_hash) {
    throw new Error(
      "This account uses Google login. Please sign in with Google."
    );
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw new Error("Invalid email or password");
  }

  const tokens = await createSession(user.id, user.email);

  return {
    ...tokens,
    user: {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      avatarUrl: user.avatar_url,
      isEmailVerified: Boolean(user.is_email_verified),
    },
  };
}

export async function findOrCreateGoogleUser(googleProfile: {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}): Promise<{ accessToken: string; refreshToken: string; user: object }> {
  const [existing] = await pool.query<User[]>(
    "SELECT * FROM users WHERE google_id = ? OR email = ?",
    [googleProfile.googleId, googleProfile.email.toLowerCase()]
  );

  let userId: number;
  let userData: object;

  if (existing.length > 0) {
    const user = existing[0];
    userId = user.id;

    // Update google_id if not set (existing email account)
    if (!user.google_id) {
      await pool.query(
        `UPDATE users 
         SET google_id = ?, 
             avatar_url = COALESCE(avatar_url, ?),
             is_email_verified = 1
         WHERE id = ?`,
        [googleProfile.googleId, googleProfile.avatarUrl, userId]
      );
    } else {
      // Update avatar if new one provided
      await pool.query(
        `UPDATE users 
         SET avatar_url = COALESCE(?, avatar_url),
             first_name = ?,
             last_name = ?
         WHERE id = ?`,
        [
          googleProfile.avatarUrl,
          googleProfile.firstName,
          googleProfile.lastName,
          userId,
        ]
      );
    }

    // Fetch updated user
    const [updated] = await pool.query<User[]>(
      "SELECT * FROM users WHERE id = ?",
      [userId]
    );

    const updatedUser = updated[0];

    userData = {
      id: updatedUser.id,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      email: updatedUser.email,
      avatarUrl: updatedUser.avatar_url,
      isEmailVerified: Boolean(updatedUser.is_email_verified),
    };
  } else {
    // Create new user
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO users (first_name, last_name, email, google_id, avatar_url, is_email_verified)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        googleProfile.firstName,
        googleProfile.lastName,
        googleProfile.email.toLowerCase(),
        googleProfile.googleId,
        googleProfile.avatarUrl || null,
      ]
    );

    userId = result.insertId;

    // Create empty profile and social links
    await pool.query("INSERT INTO profiles (user_id) VALUES (?)", [userId]);
    await pool.query("INSERT INTO social_links (user_id) VALUES (?)", [userId]);
    await createDefaultTemplate(userId);

    userData = {
      id: userId,
      firstName: googleProfile.firstName,
      lastName: googleProfile.lastName,
      email: googleProfile.email.toLowerCase(),
      avatarUrl: googleProfile.avatarUrl,
      isEmailVerified: true,
    };
  }

  const tokens = await createSession(userId, googleProfile.email.toLowerCase());

  return { ...tokens, user: userData };
}

export async function refreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyRefreshToken(refreshToken);

  const tokenHash = hashToken(refreshToken);

  const [sessions] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM sessions WHERE user_id = ? AND refresh_token_hash = ? AND expires_at > NOW()",
    [payload.userId, tokenHash]
  );

  if (sessions.length === 0) {
    throw new Error("Invalid or expired refresh token");
  }

  // Rotate refresh token
  await pool.query("DELETE FROM sessions WHERE refresh_token_hash = ?", [
    tokenHash,
  ]);

  return createSession(payload.userId, payload.email);
}

export async function logout(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await pool.query("DELETE FROM sessions WHERE refresh_token_hash = ?", [
    tokenHash,
  ]);
}

async function createSession(
  userId: number,
  email: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, email });

  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await pool.query(
    "INSERT INTO sessions (user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?)",
    [userId, tokenHash, expiresAt]
  );

  return { accessToken, refreshToken };
}

async function createDefaultTemplate(userId: number): Promise<void> {
  const subject =
    "Application for {{position}} - {{firstName}} {{lastName}}";
  const body = `Dear {{recruiterName}},

I am writing to express my interest in the {{position}} opportunity at {{company}}.

I have {{experience}} of experience in {{skills}}.

Please find my resume attached for your consideration.

I would appreciate the opportunity to discuss how my experience can contribute to your team.

Thank you for your time and consideration.

Best regards,

{{firstName}} {{lastName}}
{{phone}}
{{email}}
{{linkedin}}`;

  await pool.query(
    `INSERT INTO email_templates (user_id, name, subject, body, is_default)
     VALUES (?, 'Default Template', ?, ?, 1)`,
    [userId, subject, body]
  );
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}