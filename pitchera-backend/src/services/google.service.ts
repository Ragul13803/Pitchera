import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";

// Existing OAuth client for web flow
export function getOAuthClient() {
  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirectUri
  );
}

export function getGmailOAuthClient() {
  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.gmailRedirectUri
  );
}

export function getGoogleLoginUrl(state?: string): string {
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

export function getGmailAuthUrl(userId: number): string {
  const oauth2Client = getGmailOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      // gmail.send alone can't create/send drafts (needed for draft-based
      // scheduling) or modify message labels — gmail.compose covers both
      // draft CRUD and sending without granting broader mailbox-modify access.
      "https://www.googleapis.com/auth/gmail.compose",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    state: String(userId),
    prompt: "consent",
  });

  // ❌ REMOVE these debug lines
  // console.log("[Google OAuth] Generated Auth URL:", url);
  // console.log("[Google OAuth] Redirect URI in use:", process.env.GOOGLE_REDIRECT_URI);

  return url;
}

// Existing web flow
export async function getGoogleUserInfo(code: string): Promise<{
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}> {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: "v2", auth: client });
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
const mobileAuthClient = new OAuth2Client({
  clientId: env.google.webClientId,
});

/**
 * Verify Google ID token from mobile app
 */
export async function verifyGoogleIdToken(idToken: string): Promise<{
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  emailVerified: boolean;
}> {
  try {
    // Verify the ID token
    const ticket = await mobileAuthClient.verifyIdToken({
      idToken,
      audience: [
        env.google.clientId,
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
  } catch (error: any) {
    console.error("Google ID token verification error:", error);
    throw new Error(`Invalid Google ID token: ${error.message}`);
  }
}

// Existing Gmail exchange code function
export async function exchangeGmailCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date | null;
  gmailAddress: string;
}> {
  const client = getGmailOAuthClient();

  try {
    console.log("[Gmail OAuth] Starting token exchange");

    const { tokens } = await client.getToken(code);

    console.log("[Gmail OAuth] Token exchange successful");

    if (!tokens.refresh_token) {
      throw new Error(
        "No refresh token received. Please revoke access and try again."
      );
    }

    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data } = await oauth2.userinfo.get();

    if (!data.email) {
      throw new Error("Failed to get Gmail address");
    }

    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token,
      tokenExpiry: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : null,
      gmailAddress: data.email,
    };
  } catch (error: any) {
    console.error(
      "[Gmail OAuth] Token exchange failed:",
      error?.response?.data || error.message
    );

    throw error;
  }
}
