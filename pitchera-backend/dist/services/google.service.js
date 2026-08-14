"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOAuthClient = getOAuthClient;
exports.getGmailOAuthClient = getGmailOAuthClient;
exports.getGoogleLoginUrl = getGoogleLoginUrl;
exports.getGmailAuthUrl = getGmailAuthUrl;
exports.getGoogleUserInfo = getGoogleUserInfo;
exports.verifyGoogleIdToken = verifyGoogleIdToken;
exports.exchangeGmailCode = exchangeGmailCode;
const googleapis_1 = require("googleapis");
const google_auth_library_1 = require("google-auth-library");
const env_1 = require("../config/env");
// Existing OAuth client for web flow
function getOAuthClient() {
    return new googleapis_1.google.auth.OAuth2(env_1.env.google.clientId, env_1.env.google.clientSecret, env_1.env.google.redirectUri);
}
function getGmailOAuthClient() {
    return new googleapis_1.google.auth.OAuth2(env_1.env.google.clientId, env_1.env.google.clientSecret, env_1.env.google.gmailRedirectUri);
}
function getGoogleLoginUrl(state) {
    const client = getOAuthClient();
    return client.generateAuthUrl({
        access_type: "offline",
        scope: [
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
        ],
        prompt: "consent",
        state: state || "",
    });
}
function getGmailAuthUrl(userId) {
    const client = getGmailOAuthClient();
    return client.generateAuthUrl({
        access_type: "offline",
        scope: ["https://www.googleapis.com/auth/gmail.send"],
        prompt: "consent",
        state: String(userId),
    });
}
// Existing web flow
async function getGoogleUserInfo(code) {
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    const oauth2 = googleapis_1.google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();
    if (!data.id || !data.email) {
        throw new Error("Failed to get Google user info");
    }
    return {
        googleId: data.id,
        email: data.email,
        firstName: data.given_name || "",
        lastName: data.family_name || "",
        avatarUrl: data.picture || undefined,
    };
}
// ===== NEW: Mobile Google Authentication =====
// Create OAuth2Client for mobile ID token verification
const mobileAuthClient = new google_auth_library_1.OAuth2Client({
    clientId: env_1.env.google.webClientId,
});
/**
 * Verify Google ID token from mobile app
 */
async function verifyGoogleIdToken(idToken) {
    try {
        // Verify the ID token
        const ticket = await mobileAuthClient.verifyIdToken({
            idToken,
            audience: [
                env_1.env.google.clientId,
                // env.google.iosClientId,
                // env.google.androidClientId,
            ].filter(Boolean), // Filter out empty strings
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.sub || !payload.email) {
            throw new Error("Invalid token payload");
        }
        return {
            googleId: payload.sub,
            email: payload.email,
            firstName: payload.given_name || "",
            lastName: payload.family_name || "",
            avatarUrl: payload.picture,
            emailVerified: payload.email_verified || false,
        };
    }
    catch (error) {
        console.error("Google ID token verification error:", error);
        throw new Error(`Invalid Google ID token: ${error.message}`);
    }
}
// Existing Gmail exchange code function
async function exchangeGmailCode(code) {
    const client = getGmailOAuthClient();
    const { tokens } = await client.getToken(code);
    if (!tokens.refresh_token) {
        throw new Error("No refresh token received. Please revoke access and try again.");
    }
    client.setCredentials(tokens);
    // Get Gmail address
    const oauth2 = googleapis_1.google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();
    if (!data.email) {
        throw new Error("Failed to get Gmail address");
    }
    return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        gmailAddress: data.email,
    };
}
//# sourceMappingURL=google.service.js.map