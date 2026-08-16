import { useLogout } from "@/hooks/useLogout";
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

  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    setShowLogout(false);
    await logout();
  };

  return (
    <>
      <View style={styles.sidebar}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.logoContainer}>
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
                    isActive && styles.menuItemActive,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={isActive ? "#2563EB" : "#64748B"}
                  />

                  <Text
                    style={[
                      styles.menuText,
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
          <View style={styles.bottomBorder} />

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

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E5E7EB",

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

    backgroundColor: "#F8FAFC",

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

  menuItemActive: {
    backgroundColor: "#EFF6FF",
  },

  menuItemPressed: {
    opacity: 0.7,
  },

  menuText: {
    fontSize: 14,

    fontWeight: "500",

    color: "#64748B",
  },

  menuTextActive: {
    color: "#2563EB",

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

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  logoutPressed: {
    backgroundColor: "#FEF2F2",
  },

  logoutText: {
    fontSize: 14,

    fontWeight: "600",

    color: "#EF4444",
  },
});