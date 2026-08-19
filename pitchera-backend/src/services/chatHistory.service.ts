// src/services/chatHistory.service.ts
import pool from '../database/db';
import { RowDataPacket } from 'mysql2/promise';
import { ChatMode, StoredMessage } from '../types/chat.types';

const MAX_STORED_MESSAGES = 200; // per user

// mysql2 auto-deserializes native JSON columns into JS values already —
// `messages` comes back as an array, never a string to re-parse.
interface ChatSessionMessagesRow extends RowDataPacket {
  messages: StoredMessage[];
}

/* ─────────────────────────────────────────────────────────
   Append two messages (user + assistant) to the session.
   One row per user in chat_sessions; messages is a JSON array.
   Creates the row if it does not exist yet.
───────────────────────────────────────────────────────── */
export async function appendMessages(
  userId: number,
  userText: string,
  botText: string,
  mode: ChatMode,
): Promise<void> {
  const [rows] = await pool.query<ChatSessionMessagesRow[]>(
    `SELECT messages FROM chat_sessions WHERE user_id = ?`,
    [userId],
  );

  const existing: StoredMessage[] = rows.length ? rows[0].messages : [];

  const newMessages: StoredMessage[] = [
    { role: 'user', content: userText, mode, timestamp: new Date().toISOString() },
    { role: 'assistant', content: botText, mode, timestamp: new Date().toISOString() },
  ];

  const trimmed = [...existing, ...newMessages].slice(-MAX_STORED_MESSAGES);
  const json = JSON.stringify(trimmed);

  await pool.query(
    `INSERT INTO chat_sessions (user_id, messages, last_active)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE messages = VALUES(messages), last_active = NOW()`,
    [userId, json],
  );
}

/* ─────────────────────────────────────────────────────────
   Fetch the last N messages for a user.
───────────────────────────────────────────────────────── */
export async function getHistory(
  userId: number,
  limit = 50,
): Promise<StoredMessage[]> {
  const [rows] = await pool.query<ChatSessionMessagesRow[]>(
    `SELECT messages FROM chat_sessions WHERE user_id = ?`,
    [userId],
  );
  if (rows.length === 0) return [];

  return rows[0].messages.slice(-Math.min(limit, 100));
}
