import { useLogout } from "@/hooks/useLogout";
import { Ionicons } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import PopupModal from "./PopupModal";

const menuItems = [
  {
    label: "Dashboard",
    icon: "grid-outline" as const,
    route: "/dashboard",
  },
  {
    label: "Applied Jobs",
    icon: "briefcase-outline" as const,
    route: "/applied-jobs",
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
      {/* Sidebar */}
      <View style={styles.sidebar}>
        {/* Top Section */}
        <View style={styles.topSection}>
          {/* Logo */}
          <Text style={styles.logo}>Pitchera</Text>

          {/* Menu */}
          <View style={styles.menu}>
            {menuItems.map((item) => {
              const isActive = pathname.startsWith(item.route);

              return (
                <Pressable
                  key={item.route}
                  onPress={() => router.push(item.route as any)}
                  style={[
                    styles.menuItem,
                    isActive && styles.menuItemActive,
                  ]}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={
                      isActive
                        ? "#2563EB"
                        : "#64748B"
                    }
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
          {/* Divider */}
          <View style={styles.bottomBorder} />

          {/* Logout Button */}
          <Pressable
            onPress={() => setShowLogout(true)}
            style={styles.logoutButton}
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
        </View>
      </View>

      {/* Logout Confirmation Modal */}
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
  sidebar: {
    width: 250,

    backgroundColor: "#FFFFFF",

    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",

    paddingHorizontal: 12,
    paddingVertical: 16,

    justifyContent: "space-between",

    margin: 10,

    borderRadius: 10,

    overflow: "hidden",
  },

  /* ---------------- TOP ---------------- */

  topSection: {
    width: "100%",
  },

  logo: {
    fontSize: 30,
    fontWeight: "800",
    color: "#111827",

    alignSelf: "center",

    marginBottom: 32,
  },

  menu: {
    gap: 6,
    width: "100%",
  },

  menuItem: {
    minHeight: 48,

    borderRadius: 10,

    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  menuItemActive: {
    backgroundColor: "#EFF6FF",
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

  /* ---------------- BOTTOM ---------------- */

  bottom: {
    width: "100%",
  },

  bottomBorder: {
    height: 1,

    width: "100%",

    backgroundColor: "#E5E7EB",

    marginBottom: 10,
  },

  logoutButton: {
    minHeight: 48,

    borderRadius: 10,

    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
  },

  logoutText: {
    fontSize: 14,

    fontWeight: "600",

    color: "#EF4444",
  },
});