import { google } from "googleapis";
import { env } from "../config/env";

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
  const client = getGmailOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    prompt: "consent",
    state: String(userId),
  });
}

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

export async function exchangeGmailCode(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date | null;
  gmailAddress: string;
}> {
  const client = getGmailOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.refresh_token) {
    throw new Error(
      "No refresh token received. Please revoke access and try again."
    );
  }

  client.setCredentials(tokens);

  // Get Gmail address
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
}