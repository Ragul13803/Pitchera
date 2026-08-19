// backend/src/services/gmail.service.ts

import { google } from "googleapis";
import { RowDataPacket } from "mysql2";
import pool from "../database/db";
import { encrypt, decrypt } from "../utils/encryption";
import { getGmailOAuthClient } from "./google.service";

interface GmailAccount extends RowDataPacket {
  id: number;
  user_id: number;
  gmail_address: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string;
  token_expiry: Date | null;
  is_active: number;
}

export async function saveGmailAccount(
  userId: number,
  gmailAddress: string,
  accessToken: string,
  refreshToken: string,
  tokenExpiry: Date | null
): Promise<number> {
  const encryptedAccess = encrypt(accessToken);
  const encryptedRefresh = encrypt(refreshToken);

  const [existing] = await pool.query<GmailAccount[]>(
    "SELECT id FROM gmail_accounts WHERE user_id = ?",
    [userId]
  );

  if (existing.length > 0) {
    await pool.query(
      `UPDATE gmail_accounts 
       SET gmail_address = ?, access_token_encrypted = ?, refresh_token_encrypted = ?, 
           token_expiry = ?, is_active = 1, updated_at = NOW()
       WHERE user_id = ?`,
      [gmailAddress, encryptedAccess, encryptedRefresh, tokenExpiry, userId]
    );
    return existing[0].id;
  } else {
    const [result] = await pool.query(
      `INSERT INTO gmail_accounts 
       (user_id, gmail_address, access_token_encrypted, refresh_token_encrypted, token_expiry)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, gmailAddress, encryptedAccess, encryptedRefresh, tokenExpiry]
    );
    return (result as any).insertId;
  }
}

export async function getGmailClient(userId: number) {
  const [accounts] = await pool.query<GmailAccount[]>(
    "SELECT * FROM gmail_accounts WHERE user_id = ? AND is_active = 1",
    [userId]
  );

  if (accounts.length === 0) {
    throw new Error("No Gmail account connected");
  }

  const account = accounts[0];
  const refreshToken = decrypt(account.refresh_token_encrypted);

  const client = getGmailOAuthClient();
  client.setCredentials({ refresh_token: refreshToken });

  const { credentials } = await client.refreshAccessToken();
  client.setCredentials(credentials);

  if (credentials.access_token) {
    const encryptedAccess = encrypt(credentials.access_token);
    await pool.query(
      `UPDATE gmail_accounts 
       SET access_token_encrypted = ?, token_expiry = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [
        encryptedAccess,
        credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        userId,
      ]
    );
  }

  return { client, account };
}

/**
 * Send email via Gmail.
 *
 * ✅ To: header is ALWAYS just the raw email address.
 *    The recruiter name field is ONLY for the email body salutation.
 *    We do NOT put any display name in the To: header.
 *    This matches standard cold email tools (Hunter.io, Lemlist etc).
 */
export async function sendEmailViaGmail(
  userId: number,
  to: string,           // raw email only — never contains display name
  subject: string,
  body: string,
  attachmentPaths: string[] = []
): Promise<string> {
  const { client, account } = await getGmailClient(userId);
  const gmail = google.gmail({ version: "v1", auth: client });

  const mimeMessage = await buildMimeMessage(
    account.gmail_address,
    to,
    subject,
    body,
    attachmentPaths
  );

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: encodeBase64Url(mimeMessage) },
  });

  return response.data.id || "";
}

const SCHEDULED_LABEL_NAME = "App/Scheduled";

/**
 * Gmail's API has no "scheduled send" concept to write to — the client-only
 * Scheduled tray isn't exposed via the API. Drafts + a label is the closest
 * visible equivalent: the message appears under Gmail > Drafts (and under
 * this label) immediately, then gets sent (and removed from Drafts) at the
 * scheduled time.
 */
async function getOrCreateScheduledLabelId(gmail: ReturnType<typeof google.gmail>): Promise<string | null> {
  try {
    const { data } = await gmail.users.labels.list({ userId: "me" });
    const existing = data.labels?.find((l) => l.name === SCHEDULED_LABEL_NAME);
    if (existing?.id) return existing.id;

    const { data: created } = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: SCHEDULED_LABEL_NAME,
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });
    return created.id || null;
  } catch (error: any) {
    console.error("[Gmail] Failed to get/create scheduled label:", error.message);
    return null;
  }
}

/**
 * Create a Gmail draft for a scheduled email so the user sees it under
 * Gmail > Drafts right away, rather than nothing until send time.
 */
export async function createDraftViaGmail(
  userId: number,
  to: string,
  subject: string,
  body: string,
  attachmentPaths: string[] = []
): Promise<string> {
  const { client, account } = await getGmailClient(userId);
  const gmail = google.gmail({ version: "v1", auth: client });

  const mimeMessage = await buildMimeMessage(
    account.gmail_address,
    to,
    subject,
    body,
    attachmentPaths
  );

  const response = await gmail.users.drafts.create({
    userId: "me",
    requestBody: { message: { raw: encodeBase64Url(mimeMessage) } },
  });

  const draftId = response.data.id;
  if (!draftId) throw new Error("Gmail did not return a draft id");

  const messageId = response.data.message?.id;
  if (messageId) {
    const labelId = await getOrCreateScheduledLabelId(gmail);
    if (labelId) {
      try {
        await gmail.users.messages.modify({
          userId: "me",
          id: messageId,
          requestBody: { addLabelIds: [labelId] },
        });
      } catch (error: any) {
        console.error("[Gmail] Failed to label scheduled draft:", error.message);
      }
    }
  }

  return draftId;
}

/**
 * Send a previously-created draft. Gmail sends the message and removes it
 * from Drafts automatically — no separate delete step needed.
 */
export async function sendDraftViaGmail(userId: number, draftId: string): Promise<string> {
  const { client } = await getGmailClient(userId);
  const gmail = google.gmail({ version: "v1", auth: client });

  const response = await gmail.users.drafts.send({
    userId: "me",
    requestBody: { id: draftId },
  });

  return response.data.id || "";
}

function encodeBase64Url(input: string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function buildMimeMessage(
  from: string,
  to: string,          // raw email — no display name
  subject: string,
  body: string,
  attachmentPaths: string[]
): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");
  const boundary = `boundary_${Date.now()}`;

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to.trim().toLowerCase()}`,   // ✅ ALWAYS just raw email
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    `Content-Transfer-Encoding: quoted-printable`,
    ``,
    encodeQuotedPrintable(body),
  ];

  for (const attachPath of attachmentPaths) {
    if (!fs.existsSync(attachPath)) continue;

    const fileContent = fs.readFileSync(attachPath);
    const base64Content = fileContent.toString("base64");
    const fileName = path.basename(attachPath);
    const mimeType = getMimeType(fileName);

    lines.push(
      `--${boundary}`,
      `Content-Type: ${mimeType}; name="${fileName}"`,
      `Content-Disposition: attachment; filename="${fileName}"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      base64Content
    );
  }

  lines.push(`--${boundary}--`);
  return lines.join("\r\n");
}

function encodeQuotedPrintable(text: string): string {
  return text
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, (char) => {
      const code = char.charCodeAt(0);
      return `=${code.toString(16).toUpperCase().padStart(2, "0")}`;
    })
    .replace(/(.{73})/g, "$1=\r\n");
}

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
  };
  return types[ext || ""] || "application/octet-stream";
}

export async function getGmailStatus(userId: number): Promise<{
  connected: boolean;
  gmailAddress: string | null;
}> {
  const [accounts] = await pool.query<GmailAccount[]>(
    "SELECT gmail_address, is_active FROM gmail_accounts WHERE user_id = ?",
    [userId]
  );

  if (accounts.length === 0 || !accounts[0].is_active) {
    return { connected: false, gmailAddress: null };
  }

  return { connected: true, gmailAddress: accounts[0].gmail_address };
}

export async function disconnectGmail(userId: number): Promise<void> {
  await pool.query(
    "UPDATE gmail_accounts SET is_active = 0, updated_at = NOW() WHERE user_id = ?",
    [userId]
  );
}