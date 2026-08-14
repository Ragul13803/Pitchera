"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveGmailAccount = saveGmailAccount;
exports.getGmailClient = getGmailClient;
exports.sendEmailViaGmail = sendEmailViaGmail;
exports.getGmailStatus = getGmailStatus;
exports.disconnectGmail = disconnectGmail;
const googleapis_1 = require("googleapis");
const db_1 = __importDefault(require("../database/db"));
const encryption_1 = require("../utils/encryption");
const google_service_1 = require("./google.service");
async function saveGmailAccount(userId, gmailAddress, accessToken, refreshToken, tokenExpiry) {
    const encryptedAccess = (0, encryption_1.encrypt)(accessToken);
    const encryptedRefresh = (0, encryption_1.encrypt)(refreshToken);
    // Upsert gmail account
    const [existing] = await db_1.default.query("SELECT id FROM gmail_accounts WHERE user_id = ?", [userId]);
    if (existing.length > 0) {
        await db_1.default.query(`UPDATE gmail_accounts 
       SET gmail_address = ?, access_token_encrypted = ?, refresh_token_encrypted = ?, 
           token_expiry = ?, is_active = 1, updated_at = NOW()
       WHERE user_id = ?`, [gmailAddress, encryptedAccess, encryptedRefresh, tokenExpiry, userId]);
        return existing[0].id;
    }
    else {
        // const { ResultSetHeader } = await import("mysql2");
        const [result] = await db_1.default.query(`INSERT INTO gmail_accounts 
       (user_id, gmail_address, access_token_encrypted, refresh_token_encrypted, token_expiry)
       VALUES (?, ?, ?, ?, ?)`, [userId, gmailAddress, encryptedAccess, encryptedRefresh, tokenExpiry]);
        return result.insertId;
    }
}
async function getGmailClient(userId) {
    const [accounts] = await db_1.default.query("SELECT * FROM gmail_accounts WHERE user_id = ? AND is_active = 1", [userId]);
    if (accounts.length === 0) {
        throw new Error("No Gmail account connected");
    }
    const account = accounts[0];
    const refreshToken = (0, encryption_1.decrypt)(account.refresh_token_encrypted);
    const client = (0, google_service_1.getGmailOAuthClient)();
    client.setCredentials({
        refresh_token: refreshToken,
    });
    // Refresh access token if needed
    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);
    // Update stored access token
    if (credentials.access_token) {
        const encryptedAccess = (0, encryption_1.encrypt)(credentials.access_token);
        await db_1.default.query(`UPDATE gmail_accounts 
       SET access_token_encrypted = ?, token_expiry = ?, updated_at = NOW()
       WHERE user_id = ?`, [
            encryptedAccess,
            credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            userId,
        ]);
    }
    return { client, account };
}
async function sendEmailViaGmail(userId, to, toName, subject, body, attachmentPaths = []) {
    const { client, account } = await getGmailClient(userId);
    const gmail = googleapis_1.google.gmail({ version: "v1", auth: client });
    const mimeMessage = await buildMimeMessage(account.gmail_address, to, toName, subject, body, attachmentPaths);
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
async function buildMimeMessage(from, to, toName, subject, body, attachmentPaths) {
    const fs = await Promise.resolve().then(() => __importStar(require("fs")));
    const path = await Promise.resolve().then(() => __importStar(require("path")));
    const boundary = `boundary_${Date.now()}`;
    const lines = [
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
        if (!fs.existsSync(attachPath))
            continue;
        const fileContent = fs.readFileSync(attachPath);
        const base64Content = fileContent.toString("base64");
        const fileName = path.basename(attachPath);
        const mimeType = getMimeType(fileName);
        lines.push(`--${boundary}`, `Content-Type: ${mimeType}; name="${fileName}"`, `Content-Disposition: attachment; filename="${fileName}"`, `Content-Transfer-Encoding: base64`, ``, base64Content);
    }
    lines.push(`--${boundary}--`);
    return lines.join("\r\n");
}
function encodeQuotedPrintable(text) {
    return text
        .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, (char) => {
        const code = char.charCodeAt(0);
        return `=${code.toString(16).toUpperCase().padStart(2, "0")}`;
    })
        .replace(/(.{73})/g, "$1=\r\n");
}
function getMimeType(filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    const types = {
        pdf: "application/pdf",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
    };
    return types[ext || ""] || "application/octet-stream";
}
async function getGmailStatus(userId) {
    const [accounts] = await db_1.default.query("SELECT gmail_address, is_active FROM gmail_accounts WHERE user_id = ?", [userId]);
    if (accounts.length === 0 || !accounts[0].is_active) {
        return { connected: false, gmailAddress: null };
    }
    return { connected: true, gmailAddress: accounts[0].gmail_address };
}
async function disconnectGmail(userId) {
    await db_1.default.query("UPDATE gmail_accounts SET is_active = 0, updated_at = NOW() WHERE user_id = ?", [userId]);
}
//# sourceMappingURL=gmail.service.js.map