// src/app/(app)/connect-gmail.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/services/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type ConnectionState =
  | "checking"   // initial load — checking DB status
  | "connected"  // gmail_accounts row exists + is_active = 1
  | "disconnected" // no active row
  | "connecting" // user clicked Connect, waiting for OAuth
  | "error";     // something went wrong

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ConnectGmailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    success?: string;
    gmail?: string;
    error?: string;
    returnTo?: string;
  }>();

  const [state, setState] = useState<ConnectionState>("checking");
  const [gmailAddress, setGmailAddress] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [disconnecting, setDisconnecting] = useState(false);

  // ── returnTo — where to go after connecting ──────────────────────────────
  // const returnTo = params.returnTo ?? "/(app)/add-job";

  // ─── Check current Gmail status ───────────────────────────────────────────

  const checkStatus = useCallback(async () => {
    try {
      setState("checking");
      const res: any = await api.get("/gmail/status");
      const data = res?.data ?? res;

      if (data?.connected && data?.gmailAddress) {
        setGmailAddress(data.gmailAddress);
        setState("connected");
      } else {
        setState("disconnected");
      }
    } catch {
      setState("disconnected");
    }
  }, []);

  // ─── Handle OAuth redirect params (from Google callback) ─────────────────
  //
  // After Google redirects to /connect-gmail?success=true&gmail=...
  // or /connect-gmail?error=...
  // Expo Router puts those in useLocalSearchParams.

  useEffect(() => {
    if (params.success === "true" && params.gmail) {
      setGmailAddress(decodeURIComponent(params.gmail));
      setState("connected");
      return;
    }

    if (params.error) {
      const raw = decodeURIComponent(params.error);
      setErrorMessage(friendlyError(raw));
      setState("error");
      return;
    }

    // No params — just check DB status
    checkStatus();
  }, [params.success, params.gmail, params.error]);

  // ─── Connect Gmail ────────────────────────────────────────────────────────

  const handleConnect = async () => {
    try {
      setState("connecting");
      setErrorMessage("");

      // Ask backend for the Google OAuth URL
      const res: any = await api.get("/gmail/connect");
      const data = res?.data ?? res;
      const url: string = data?.url ?? data?.data?.url ?? "";

      if (!url) {
        throw new Error("Could not generate Gmail auth URL.");
      }

      console.log("[ConnectGmail] Opening OAuth URL:", url);

      // Open in system browser — Google requires real browser for OAuth
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        throw new Error("Cannot open browser on this device.");
      }

      await Linking.openURL(url);

      // After the user authorises, Google redirects to
      // env.frontendUrl/connect-gmail?success=true&gmail=...
      // On web: Expo Router picks up the new URL params automatically.
      // On native: you need a deep link handler (see note below).

    } catch (err: any) {
      console.error("[ConnectGmail] Error:", err);
      setErrorMessage(friendlyError(err.message));
      setState("error");
    }
  };

  // ─── Disconnect Gmail ─────────────────────────────────────────────────────

  const handleDisconnect = async () => {
    try {
      setDisconnecting(true);
      await api.delete("/gmail/disconnect");
      setGmailAddress(null);
      setState("disconnected");
    } catch (err: any) {
      setErrorMessage(friendlyError(err.message));
    } finally {
      setDisconnecting(false);
    }
  };

  // ─── Friendly error messages ──────────────────────────────────────────────

  function friendlyError(raw: string): string {
    const lower = raw.toLowerCase();
    if (lower.includes("invalid_grant"))
      return "Google rejected the authorisation. Please try connecting again.";
    if (lower.includes("access_denied"))
      return "You cancelled the Gmail authorisation. Please try again and click Allow.";
    if (lower.includes("invalid_state"))
      return "The authorisation session expired. Please try again.";
    if (lower.includes("network") || lower.includes("fetch"))
      return "Network error. Check your internet connection.";
    return raw || "Something went wrong. Please try again.";
  }

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderChecking = () => (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>
        Checking Gmail status…
      </Text>
    </View>
  );

  const renderConnecting = () => (
    <View style={styles.centerBox}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.statusText, { color: colors.textSecondary }]}>
        Opening Google Sign-In…
      </Text>
      <Text style={[styles.statusSubtext, { color: colors.textSecondary }]}>
        Complete authorisation in the browser, then return here.
      </Text>
      <TouchableOpacity
        onPress={checkStatus}
        style={[styles.refreshBtn, { borderColor: colors.border }]}
      >
        <Ionicons name="refresh-outline" size={16} color={colors.primary} />
        <Text style={[styles.refreshBtnText, { color: colors.primary }]}>
          I've completed authorisation
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConnected = () => (
    <View style={styles.centerBox}>
      {/* Success icon */}
      <View style={[styles.successCircle, { backgroundColor: "#DCFCE7" }]}>
        <Ionicons name="checkmark-circle" size={56} color="#16A34A" />
      </View>

      <Text style={[styles.connectedTitle, { color: colors.text }]}>
        Gmail Connected
      </Text>

      <View
        style={[
          styles.gmailPill,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Ionicons name="mail" size={16} color="#EA4335" />
        <Text style={[styles.gmailPillText, { color: colors.text }]}>
          {gmailAddress}
        </Text>
      </View>

      <Text style={[styles.connectedDesc, { color: colors.textSecondary }]}>
        Cold emails will be sent directly from this Gmail account. Recruiters
        will see your real email address as the sender.
      </Text>

      {/* Continue to send */}
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/applications/AddApplication' as any)}
        activeOpacity={0.85}
      >
        <Ionicons name="send-outline" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Continue to Send Email</Text>
      </TouchableOpacity>

      {/* Disconnect */}
      <TouchableOpacity
        style={[styles.disconnectBtn, { borderColor: "#FCA5A5" }]}
        onPress={handleDisconnect}
        disabled={disconnecting}
        activeOpacity={0.75}
      >
        {disconnecting ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <>
            <Ionicons name="unlink-outline" size={16} color="#EF4444" />
            <Text style={styles.disconnectBtnText}>Disconnect Gmail</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderDisconnected = () => (
    <View style={styles.centerBox}>
      {/* Gmail icon */}
      <View style={[styles.gmailIconCircle, { backgroundColor: "#FEF2F2" }]}>
        <Text style={styles.gmailIconText}>G</Text>
      </View>

      <Text style={[styles.connectTitle, { color: colors.text }]}>
        Connect Your Gmail
      </Text>

      <Text style={[styles.connectDesc, { color: colors.textSecondary }]}>
        Pitchera sends cold emails directly from your own Gmail account.
        Recruiters see{" "}
        <Text style={{ fontWeight: "700", color: colors.text }}>
          your real email address
        </Text>{" "}
        as the sender — not a third-party service.
      </Text>

      {/* How it works */}
      <View
        style={[
          styles.howItWorksCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.howItWorksTitle, { color: colors.text }]}>
          How it works
        </Text>

        {[
          {
            icon: "lock-closed-outline" as const,
            text: "You authorise Pitchera via Google's secure OAuth — we never see your password.",
          },
          {
            icon: "mail-outline" as const,
            text: "Emails are sent through Gmail API using your account.",
          },
          {
            icon: "person-outline" as const,
            text: "Recruiters receive email from your address, not a bulk sender.",
          },
          {
            icon: "shield-checkmark-outline" as const,
            text: "You can disconnect at any time from this screen.",
          },
        ].map((item, i) => (
          <View key={i} style={styles.howItWorksRow}>
            <View
              style={[
                styles.howItWorksIconBox,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons name={item.icon} size={15} color={colors.primary} />
            </View>
            <Text
              style={[styles.howItWorksText, { color: colors.textSecondary }]}
            >
              {item.text}
            </Text>
          </View>
        ))}
      </View>

      {/* Connect button */}
      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        onPress={handleConnect}
        activeOpacity={0.85}
      >
        <Ionicons name="logo-google" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Connect Gmail Account</Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerBox}>
      <View style={[styles.errorCircle, { backgroundColor: "#FEF2F2" }]}>
        <Ionicons name="alert-circle" size={52} color="#DC2626" />
      </View>

      <Text style={[styles.errorTitle, { color: colors.text }]}>
        Connection Failed
      </Text>

      <View
        style={[
          styles.errorMsgBox,
          { backgroundColor: "#FEF2F2", borderColor: "#FCA5A5" },
        ]}
      >
        <Text style={styles.errorMsgText}>{errorMessage}</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
        onPress={() => {
          setState("disconnected");
          setErrorMessage("");
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="refresh-outline" size={18} color="#fff" />
        <Text style={styles.primaryBtnText}>Try Again</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, { borderColor: colors.border }]}
        onPress={checkStatus}
        activeOpacity={0.75}
      >
        <Ionicons
          name="checkmark-circle-outline"
          size={16}
          color={colors.primary}
        />
        <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
          Check if already connected
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Main render ──────────────────────────────────────────────────────────

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Gmail Connection
          </Text>
          {state === "connected" && gmailAddress && (
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {gmailAddress}
            </Text>
          )}
        </View>

        {/* Status indicator */}
        <View
          style={[
            styles.statusPill,
            {
              backgroundColor:
                state === "connected"
                  ? "#DCFCE7"
                  : state === "checking" || state === "connecting"
                  ? colors.primary + "15"
                  : "#FEF2F2",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  state === "connected"
                    ? "#16A34A"
                    : state === "checking" || state === "connecting"
                    ? colors.primary
                    : "#EF4444",
              },
            ]}
          />
          <Text
            style={[
              styles.statusPillText,
              {
                color:
                  state === "connected"
                    ? "#16A34A"
                    : state === "checking" || state === "connecting"
                    ? colors.primary
                    : "#EF4444",
              },
            ]}
          >
            {state === "connected"
              ? "Connected"
              : state === "connecting"
              ? "Connecting"
              : state === "checking"
              ? "Checking"
              : "Not Connected"}
          </Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {state === "checking" && renderChecking()}
        {state === "connecting" && renderConnecting()}
        {state === "connected" && renderConnected()}
        {state === "disconnected" && renderDisconnected()}
        {state === "error" && renderError()}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  headerSubtitle: { fontSize: 11, marginTop: 1 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusPillText: { fontSize: 11, fontWeight: "700" },

  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },

  centerBox: {
    flex: 1,
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },

  // Connected state
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  connectedTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  gmailPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  gmailPillText: { fontSize: 14, fontWeight: "600" },
  connectedDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 340,
  },

  // Disconnected state
  gmailIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  gmailIconText: {
    fontSize: 52,
    fontWeight: "900",
    color: "#EA4335",
    lineHeight: 60,
  },
  connectTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  connectDesc: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 340,
  },

  // How it works card
  howItWorksCard: {
    width: "100%",
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  howItWorksTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  howItWorksRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  howItWorksIconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  howItWorksText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },

  // Checking / connecting
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
  },
  statusSubtext: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 300,
  },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 8,
  },
  refreshBtnText: { fontSize: 13, fontWeight: "600" },

  // Error state
  errorCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  errorMsgBox: {
    width: "100%",
    maxWidth: 380,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  errorMsgText: {
    color: "#DC2626",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },

  // Shared buttons
  primaryBtn: {
    width: "100%",
    maxWidth: 380,
    height: 52,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    width: "100%",
    maxWidth: 380,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "600" },
  disconnectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    marginTop: 4,
  },
  disconnectBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "600",
  },
});