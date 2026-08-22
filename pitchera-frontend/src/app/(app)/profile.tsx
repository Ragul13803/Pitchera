import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  Platform,
  Pressable,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../context/ThemeContext";
import { useLogout } from "@/hooks/useLogout";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import PopupModal from "@/components/PopupModal";
import api from "@/services/api";
import Toast from "react-native-toast-message";

interface PitcheraUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
}

interface ResumeFile {
  id?: number | string;
  fileName: string;
  fileUrl?: string;
  fileSize?: number;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { logout } = useLogout();

  const [user, setUser] = useState<PitcheraUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogout, setShowLogout] = useState(false);

  const [gmailStatus, setGmailStatus] = useState<{
    checked: boolean;
    connected: boolean;
    gmailAddress: string | null;
  }>({
    checked: false,
    connected: false,
    gmailAddress: null,
  });

  const [resume, setResume] = useState<ResumeFile | null>(null);
  const [resumeFetching, setResumeFetching] = useState(true);

  // ========================================
  // Resume Upload Hook
  // ========================================

  const { uploadResume, uploading: resumeLoading } = useResumeUpload(
    (uploadedResume) => {
      // Update UI with uploaded resume
      setResume({
        id: uploadedResume.id,
        fileName: uploadedResume.fileName,
        fileUrl: uploadedResume.fileUrl,
        fileSize: uploadedResume.fileSize,
      });
    }
  );

  useEffect(() => {
    loadUser();
    checkGmailStatus();
    loadResume();
  }, []);

  // --------------------------------------------------
  // LOAD USER
  // --------------------------------------------------

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("pitchera_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // GMAIL STATUS
  // --------------------------------------------------

  const checkGmailStatus = async () => {
    try {
      const res: any = await api.get("/gmail/status");
      const data = res?.data ?? res;

      setGmailStatus({
        checked: true,
        connected: data?.connected === true,
        gmailAddress: data?.gmailAddress ?? null,
      });
    } catch (error) {
      console.error("Failed to check Gmail status:", error);
      setGmailStatus({
        checked: true,
        connected: false,
        gmailAddress: null,
      });
    }
  };

  // --------------------------------------------------
  // LOAD EXISTING RESUME
  // --------------------------------------------------

  const loadResume = async () => {
    try {
      setResumeFetching(true);

      const res: any = await api.get("/resume");
      const data = res?.data ?? res;
      const existingResume = data?.resume ?? data?.data ?? data ?? null;

      if (existingResume && (existingResume.fileName || existingResume.filename)) {
        setResume({
          id: existingResume.id,
          fileName: existingResume.fileName ?? existingResume.filename ?? "Resume.pdf",
          fileUrl: existingResume.fileUrl ?? existingResume.url ?? undefined,
          fileSize: existingResume.fileSize ?? existingResume.size ?? undefined,
        });
      } else {
        setResume(null);
      }
    } catch (error) {
      console.log("No existing resume found");
      setResume(null);
    } finally {
      setResumeFetching(false);
    }
  };

  // --------------------------------------------------
  // FORMAT FILE SIZE
  // --------------------------------------------------

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // --------------------------------------------------
  // VIEW RESUME
  // --------------------------------------------------

  const handleViewResume = () => {
    if (resume?.fileUrl) {
      Linking.openURL(resume.fileUrl);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const handleLogout = async () => {
    setShowLogout(false);
    try {
      await logout();
      Toast.show({
        type: "success",
        text1: "Logout Successful!",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // --------------------------------------------------
  // LOADING STATE
  // --------------------------------------------------

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // --------------------------------------------------
  // NO SESSION
  // --------------------------------------------------

  if (!user) {
    return (
      <>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.noSessionContent}>
            <View style={[styles.noSessionIcon, { backgroundColor: colors.primary + "15" }]}>
              <Ionicons name="person-circle-outline" size={72} color={colors.primary} />
            </View>
            <Text style={[styles.noUserText, { color: colors.text }]}>No session found</Text>
            <Text style={[styles.noUserSubText, { color: colors.textSecondary }]}>
              Your login session could not be found. Please login again to continue.
            </Text>
          </View>

          <View style={styles.bottomLogoutContainer}>
            <Pressable
              onPress={() => setShowLogout(true)}
              style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
            >
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Logout</Text>
            </Pressable>
          </View>
        </View>

        <PopupModal
          visible={showLogout}
          title="Logout"
          message="Are you sure you want to logout?"
          cancelText="Cancel"
          confirmText="Logout"
          confirmBackgroundColor="#9F2B2B"
          onClose={() => setShowLogout(false)}
          onConfirm={handleLogout}
        />
      </>
    );
  }

  // --------------------------------------------------
  // RENDER PROFILE
  // --------------------------------------------------

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const initials = `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* HEADER */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>My Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* PROFILE SECTION */}
          <View style={styles.avatarSection}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
            <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
            <View style={styles.verifiedRow}>
              <Text style={[styles.email, { color: colors.textSecondary }]}>{user.email}</Text>
              {user.isEmailVerified && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
            </View>
          </View>

          {/* ACCOUNT INFORMATION */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Account Information</Text>

            {/* First Name */}
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>First Name</Text>
                <Text style={[styles.value, { color: colors.text }]}>{user.firstName}</Text>
              </View>
            </View>

            {/* Last Name */}
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Last Name</Text>
                <Text style={[styles.value, { color: colors.text }]}>{user.lastName}</Text>
              </View>
            </View>

            {/* Email */}
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="mail-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                <Text style={[styles.value, { color: colors.text }]}>{user.email}</Text>
              </View>
            </View>

            {/* User ID */}
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + "15" }]}>
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>User ID</Text>
                <Text style={[styles.value, { color: colors.text }]}>{user.id}</Text>
              </View>
            </View>

            {/* Gmail Status */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: gmailStatus.connected ? "#10B98115" : "#F59E0B15" },
                ]}
              >
                <Ionicons
                  name={gmailStatus.connected ? "checkmark-circle-outline" : "alert-circle-outline"}
                  size={20}
                  color={gmailStatus.connected ? "#10B981" : "#F59E0B"}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Gmail Status</Text>
                <Text
                  style={[
                    styles.value,
                    { color: gmailStatus.connected ? "#10B981" : "#F59E0B" },
                  ]}
                >
                  {gmailStatus.connected ? "Connected" : "Not Connected"}
                </Text>
                {gmailStatus.connected && gmailStatus.gmailAddress && (
                  <Text style={[styles.secondaryValue, { color: colors.textSecondary }]}>
                    {gmailStatus.gmailAddress}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ========================================== */}
          {/* RESUME SECTION */}
          {/* ========================================== */}

          <View style={[styles.resumeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resumeHeader}>
              <View style={[styles.resumeIcon, { backgroundColor: "#EF444415" }]}>
                <Ionicons name="document-text-outline" size={24} color="#EF4444" />
              </View>
              <View style={styles.resumeHeaderText}>
                <Text style={[styles.resumeTitle, { color: colors.text }]}>Resume</Text>
                <Text style={[styles.resumeSubtitle, { color: colors.textSecondary }]}>
                  Upload your latest resume
                </Text>
              </View>
            </View>

            {resumeFetching ? (
              <View style={styles.resumeLoading}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Checking resume...</Text>
              </View>
            ) : resume ? (
              <>
                {/* EXISTING RESUME */}
                <View
                  style={[
                    styles.existingResume,
                    { backgroundColor: colors.background, borderColor: colors.border },
                  ]}
                >
                  <View style={[styles.pdfIcon, { backgroundColor: "#EF444415" }]}>
                    <Ionicons name="document-text" size={24} color="#EF4444" />
                  </View>
                  <View style={styles.existingResumeInfo}>
                    <Text numberOfLines={1} style={[styles.resumeFileName, { color: colors.text }]}>
                      {resume.fileName}
                    </Text>
                    <Text style={[styles.resumeFileMeta, { color: colors.textSecondary }]}>
                      PDF{resume.fileSize ? ` • ${formatFileSize(resume.fileSize)}` : ""}
                    </Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                </View>

                {/* VIEW RESUME BUTTON */}
                {resume.fileUrl && (
                  <Pressable
                    onPress={handleViewResume}
                    style={({ pressed }) => [
                      styles.viewButton,
                      { backgroundColor: colors.primary },
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Ionicons name="eye-outline" size={19} color="#fff" />
                    <Text style={styles.viewButtonText}>View Resume</Text>
                  </Pressable>
                )}

                {/* REPLACE RESUME BUTTON */}
                <Pressable
                  onPress={uploadResume}
                  disabled={resumeLoading}
                  style={({ pressed }) => [
                    styles.replaceButton,
                    { borderColor: colors.primary },
                    pressed && { opacity: 0.7 },
                    resumeLoading && { opacity: 0.5 },
                  ]}
                >
                  {resumeLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="refresh-outline" size={19} color={colors.primary} />
                  )}
                  <Text style={[styles.replaceButtonText, { color: colors.primary }]}>
                    {resumeLoading ? "Uploading..." : "Replace Resume"}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* UPLOAD AREA */}
                <Pressable
                  onPress={uploadResume}
                  disabled={resumeLoading}
                  style={({ pressed }) => [
                    styles.uploadArea,
                    {
                      borderColor: colors.primary + "70",
                      backgroundColor: colors.primary + "08",
                    },
                    pressed && { opacity: 0.7 },
                    resumeLoading && { opacity: 0.5 },
                  ]}
                >
                  <View style={[styles.uploadIconCircle, { backgroundColor: colors.primary + "15" }]}>
                    {resumeLoading ? (
                      <ActivityIndicator size="small" color={colors.primary} />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                    )}
                  </View>
                  <Text style={[styles.uploadTitle, { color: colors.text }]}>
                    {resumeLoading ? "Uploading resume..." : "Upload Resume"}
                  </Text>
                  <Text style={[styles.uploadDescription, { color: colors.textSecondary }]}>
                    Tap to select your PDF resume
                  </Text>
                  <View style={styles.uploadLimitRow}>
                    <View style={[styles.pdfBadge, { backgroundColor: "#EF444415" }]}>
                      <Text style={styles.pdfBadgeText}>PDF</Text>
                    </View>
                    <Text style={[styles.uploadLimitText, { color: colors.textSecondary }]}>
                      Maximum 5 MB
                    </Text>
                  </View>
                </Pressable>
              </>
            )}

            {/* INFO */}
            <View style={styles.resumeInfoRow}>
              <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.resumeInfoText, { color: colors.textSecondary }]}>
                Only PDF files are supported. Maximum file size is 5 MB.
              </Text>
            </View>
          </View>

          {/* LOGOUT BUTTON */}
          <Pressable
            onPress={() => setShowLogout(true)}
            style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* LOGOUT CONFIRMATION */}
      <PopupModal
        visible={showLogout}
        title="Logout"
        message="Are you sure you want to logout?"
        cancelText="Cancel"
        confirmText="Logout"
        confirmBackgroundColor="#9F2B2B"
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}

// ======================================================
// STYLES (Keep your existing styles + add these)
// ======================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  content: { padding: 16, paddingBottom: 100 },
  avatarSection: { alignItems: "center", paddingVertical: 28 },
  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: "#fff", fontSize: 34, fontWeight: "800" },
  name: { fontSize: 24, fontWeight: "800", marginTop: 16 },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 7 },
  email: { fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  cardTitle: { fontSize: 17, fontWeight: "700", marginBottom: 8 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  label: { fontSize: 12, marginBottom: 3 },
  value: { fontSize: 15, fontWeight: "600" },
  secondaryValue: { fontSize: 12, marginTop: 3 },
  resumeCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16 },
  resumeHeader: { flexDirection: "row", alignItems: "center" },
  resumeIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resumeHeaderText: { flex: 1 },
  resumeTitle: { fontSize: 17, fontWeight: "700" },
  resumeSubtitle: { fontSize: 13, marginTop: 3 },
  uploadArea: {
    marginTop: 16,
    minHeight: 190,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  uploadIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  uploadTitle: { fontSize: 16, fontWeight: "700" },
  uploadDescription: { fontSize: 13, marginTop: 5 },
  uploadLimitRow: { flexDirection: "row", alignItems: "center", marginTop: 14, gap: 8 },
  pdfBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pdfBadgeText: { color: "#EF4444", fontSize: 10, fontWeight: "800" },
  uploadLimitText: { fontSize: 12 },
  existingResume: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },
  pdfIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  existingResumeInfo: { flex: 1, marginRight: 8 },
  resumeFileName: { fontSize: 14, fontWeight: "700" },
  resumeFileMeta: { fontSize: 12, marginTop: 4 },
  viewButton: {
    height: 44,
    borderRadius: 10,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  viewButtonText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  replaceButton: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  replaceButtonText: { fontSize: 14, fontWeight: "700" },
  resumeLoading: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: { fontSize: 13 },
  resumeInfoRow: { flexDirection: "row", alignItems: "flex-start", marginTop: 12, gap: 6 },
  resumeInfoText: { flex: 1, fontSize: 11, lineHeight: 16 },
  logoutButton: {
    marginTop: 24,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutButtonPressed: { opacity: 0.7 },
  logoutText: { fontSize: 14, fontWeight: "700", color: "#EF4444" },
  noSessionContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 35,
    paddingBottom: 80,
  },
  noSessionIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  noUserText: { fontSize: 21, fontWeight: "800", textAlign: "center" },
  noUserSubText: { fontSize: 14, lineHeight: 21, marginTop: 8, textAlign: "center", maxWidth: 300 },
  bottomLogoutContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: Platform.OS === "ios" ? 30 : 18,
  },
});