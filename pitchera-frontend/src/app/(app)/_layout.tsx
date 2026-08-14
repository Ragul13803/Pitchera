import { Platform, ActivityIndicator, View } from "react-native";
import { Redirect, Slot, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppShell } from "@/components/appshell";
import { useAuth } from "@/context/AuthContext";

export default function AppLayout() {
  const { isLoading, isAuthenticated } = useAuth();

  // Wait until localStorage / SecureStore has been checked
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // No access token OR no user → login
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Authenticated → render protected app
  if (Platform.OS === "web") {
    return (
      <AppShell>
        <Slot />
      </AppShell>
    );
  }

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="applied-jobs"
        options={{
          title: "Applied",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="briefcase-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="person-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
