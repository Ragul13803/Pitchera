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
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useLogout } from "@/hooks/useLogout";
import PopupModal from "@/components/PopupModal";
import api from "@/services/api";

interface PitcheraUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
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
  }>({ checked: false, connected: false, gmailAddress: null });
  

  useEffect(() => {
    loadUser();
  }, []);

  // Check Gmail on mount
  useEffect(() => {
    api.get("/gmail/status")
      .then((res: any) => {
        const data = res?.data ?? res;
        console.log('data', data);
        
        
        setGmailStatus({
          checked: true,
          connected: data?.connected === true,
          gmailAddress: data?.gmailAddress ?? null,
        });
      })
      .catch(() => {
        setGmailStatus({ checked: true, connected: false, gmailAddress: null });
      });
  }, []);
  

  const loadUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem("pitchera_user");

      if (storedUser) {
        const parsedUser: PitcheraUser = JSON.parse(storedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Failed to load pitchera_user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        <Ionicons
          name="person-circle-outline"
          size={70}
          color={colors.textSecondary}
        />

        <Text
          style={[
            styles.noUserText,
            {
              color: colors.text,
            },
          ]}
        >
          No user session found
        </Text>

        <Text
          style={[
            styles.noUserSubText,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          Please login again.
        </Text>
      </View>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const initials =
    `${user.firstName?.charAt(0) ?? ""}${user.lastName?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
          },
        ]}
      >
        {/* Top Bar */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.headerTitle,
              {
                color: colors.text,
              },
            ]}
          >
            My Profile
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Profile Avatar */}
          <View style={styles.avatarSection}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatar}
              />
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  {
                    backgroundColor: colors.primary,
                  },
                ]}
              >
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}

            <Text
              style={[
                styles.name,
                {
                  color: colors.text,
                },
              ]}
            >
              {fullName}
            </Text>

            <View style={styles.verifiedRow}>
              <Text
                style={[
                  styles.email,
                  {
                    color: colors.textSecondary,
                  },
                ]}
              >
                {user.email}
              </Text>

              {user.isEmailVerified && (
                <Ionicons
                  name="checkmark-circle"
                  size={18}
                  color="#10B981"
                />
              )}
            </View>
          </View>

          {/* User Information */}
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.cardTitle,
                {
                  color: colors.text,
                },
              ]}
            >
              Account Information
            </Text>

            {/* First Name */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: colors.primary + "15",
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  First Name
                </Text>

                <Text
                  style={[
                    styles.value,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {user.firstName}
                </Text>
              </View>
            </View>

            {/* Last Name */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: colors.primary + "15",
                  },
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Last Name
                </Text>

                <Text
                  style={[
                    styles.value,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {user.lastName}
                </Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: colors.primary + "15",
                  },
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Email
                </Text>

                <Text
                  style={[
                    styles.value,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {user.email}
                </Text>
              </View>
            </View>

            {/* User ID */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: colors.primary + "15",
                  },
                ]}
              >
                <Ionicons
                  name="finger-print-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  User ID
                </Text>

                <Text
                  style={[
                    styles.value,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {user.id}
                </Text>
              </View>
            </View>

            {/* Email Verification */}
            {/* <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: user.isEmailVerified
                      ? "#10B98115"
                      : "#F59E0B15",
                  },
                ]}
              >
                <Ionicons
                  name={
                    user.isEmailVerified
                      ? "checkmark-circle-outline"
                      : "alert-circle-outline"
                  }
                  size={20}
                  color={
                    user.isEmailVerified
                      ? "#10B981"
                      : "#F59E0B"
                  }
                />
              </View>

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  Email Status
                </Text>

                <Text
                  style={[
                    styles.value,
                    {
                      color: user.isEmailVerified
                        ? "#10B981"
                        : "#F59E0B",
                    },
                  ]}
                >
                  {user.isEmailVerified
                    ? "Verified"
                    : "Not Verified"}
                </Text>
              </View>
            </View> */}

            {/* Gmail Connected Verification */}
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: gmailStatus?.connected
                      ? "#10B98115"
                      : "#F59E0B15",
                  },
                ]}
              >
                <Ionicons
                  name={
                    gmailStatus?.connected
                      ? "checkmark-circle-outline"
                      : "alert-circle-outline"
                  }
                  size={20}
                  color={
                    gmailStatus?.connected
                      ? "#10B981"
                      : "#F59E0B"
                  }
                />
              </View>

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.label,
                    {
                      color: colors.textSecondary,
                    },
                  ]}
                >
                  G-mail Status
                </Text>

                <Text
                  style={[
                    styles.value,
                    {
                      color: user.isEmailVerified
                        ? "#10B981"
                        : "#F59E0B",
                    },
                  ]}
                >
                  {user.isEmailVerified
                    ? "Verified"
                    : "Not Verified"}
                </Text>
              </View>
            </View>
          </View>

          {/* Logout Button */}
          <Pressable
            onPress={() => setShowLogout(true)}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutButtonPressed,
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#EF4444"
            />

            <Text style={styles.logoutText}>
              Logout
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Logout Confirmation */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  content: {
    padding: 16,

    // Extra space for mobile bottom navigation
    paddingBottom: 80,
  },

  avatarSection: {
    alignItems: "center",
    paddingVertical: 28,
  },

  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },

  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  initials: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "800",
  },

  name: {
    fontSize: 24,
    fontWeight: "800",
    marginTop: 16,
  },

  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
  },

  email: {
    fontSize: 14,
  },

  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 8,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },

  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  label: {
    fontSize: 12,
    marginBottom: 3,
  },

  value: {
    fontSize: 15,
    fontWeight: "600",
  },

  /* ---------------- LOGOUT ---------------- */

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

  logoutButtonPressed: {
    opacity: 0.7,
  },

  logoutText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF4444",
  },

  noUserText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 15,
  },

  noUserSubText: {
    fontSize: 14,
    marginTop: 6,
  },
});