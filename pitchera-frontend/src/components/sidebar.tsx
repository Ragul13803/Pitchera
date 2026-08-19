import { useLogout } from "@/hooks/useLogout";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import PITCHERA_FULL_LOGO from "@/assets/images/pitchera_full_logo.png";
import PopupModal from "./PopupModal";
import Toast from "react-native-toast-message";

const menuItems = [
  {
    label: "Dashboard",
    icon: "grid-outline" as const,
    route: "/dashboard",
  },
  {
    label: "Applications",
    icon: "briefcase-outline" as const,
    route: "/applications",
  },
  {
    label: "Profile",
    icon: "person-outline" as const,
    route: "/profile",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useLogout();
  const { colors } = useTheme();

  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
    Toast.show({ type: "success", text1: "Logout Successful!" });
  };

  return (
    <>
      <View
        style={[
          styles.sidebar,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Brand */}
          <View style={styles.brand}>
            <View style={[styles.logoContainer, { backgroundColor: colors.background }]}>
              <Image
                source={PITCHERA_FULL_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Navigation */}
          <View style={styles.menu}>
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.route);

              return (
                <Pressable
                  key={item.route}
                  onPress={() => router.push(item.route as any)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    isActive && { backgroundColor: colors.primary + "18" },
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.menuText,
                      { color: isActive ? colors.primary : colors.textSecondary },
                      isActive && styles.menuTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottom}>
          <View style={[styles.bottomBorder, { backgroundColor: colors.border }]} />

          <Pressable
            onPress={() => setShowLogout(true)}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.logoutPressed,
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#EF4444"
            />

            <Text style={styles.logoutText}>Logout</Text>
          </Pressable>
        </View>
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
  /* ================================
     SIDEBAR
  ================================= */

  sidebar: {
    width: 250,

    borderWidth: 1,

    paddingHorizontal: 12,
    paddingVertical: 18,

    margin: 10,

    borderRadius: 14,

    justifyContent: "space-between",

    overflow: "hidden",
  },

  topSection: {
    width: "100%",
  },

  /* ================================
     BRAND / LOGO
  ================================= */

  brand: {
    width: "100%",
    alignItems: "center",
    marginBottom: 24,
  },

  logoContainer: {
    width: 220,
    height: 70,

    borderRadius: 8,

    overflow: "hidden",

    alignItems: "center",
    justifyContent: "center",
  },

  logoImage: {
    width: "100%",
    height: "100%",
  },

  /* ================================
     MENU
  ================================= */

  menu: {
    width: "100%",
    gap: 6,
  },

  menuItem: {
    minHeight: 48,

    width: "100%",

    paddingHorizontal: 12,

    borderRadius: 10,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  menuItemPressed: {
    opacity: 0.7,
  },

  menuText: {
    fontSize: 14,

    fontWeight: "500",
  },

  menuTextActive: {
    fontWeight: "700",
  },

  /* ================================
     BOTTOM
  ================================= */

  bottom: {
    width: "100%",
  },

  bottomBorder: {
    width: "100%",
    height: 1,

    backgroundColor: "#E5E7EB",

    marginBottom: 10,
  },

  /* ================================
     LOGOUT
  ================================= */

logoutButton: {
  minHeight: 48,
  width: "100%",
  paddingHorizontal: 12,

  borderRadius: 10,
  borderWidth: 1.8,
  borderColor: "#cd5252",

  flexDirection: "row",
  alignItems: "center",
  gap: 12,

  backgroundColor: "#f3c1c1",
},

  logoutPressed: {
    backgroundColor: "#FEF2F2",
    opacity: 0.7,
  },

  logoutText: {
    fontSize: 14,

    fontWeight: "600",

    color: "#EF4444",
  },
});