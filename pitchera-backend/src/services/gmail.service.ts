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

  // Upsert gmail account
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
    // const { ResultSetHeader } = await import("mysql2");
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
  client.setCredentials({
    refresh_token: refreshToken,
  });

  // Refresh access token if needed
  const { credentials } = await client.refreshAccessToken();
  client.setCredentials(credentials);

  // Update stored access token
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

export async function sendEmailViaGmail(
  userId: number,
  to: string,
  toName: string,
  subject: string,
  body: string,
  attachmentPaths: string[] = []
): Promise<string> {
  const { client, account } = await getGmailClient(userId);

  const gmail = google.gmail({ version: "v1", auth: client });

  const mimeMessage = await buildMimeMessage(
    account.gmail_address,
    to,
    toName,
    subject,
    body,
    attachmentPaths
  );

  const encodedMessage = Buffer.from(mimeMessage)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });

  return response.data.id || "";
}

async function buildMimeMessage(
  from: string,
  to: string,
  toName: string,
  subject: string,
  body: string,
  attachmentPaths: string[]
): Promise<string> {
  const fs = await import("fs");
  const path = await import("path");
  const boundary = `boundary_${Date.now()}`;

  const lines: string[] = [
    `From: ${from}`,
    `To: ${toName ? `${toName} <${to}>` : to}`,
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