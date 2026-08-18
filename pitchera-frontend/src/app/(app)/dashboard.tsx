import { useAuth } from "@/context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Dashboard() {
  const { colors } = useTheme();
  const { user } = useAuth();

  const fullName = `${user?.firstName} ${user?.lastName}`.trim();

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.welcomeRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {greeting()},
          </Text>
          <Text style={[styles.userName, { color: colors.textSecondary }]}>
            {fullName} 👋
          </Text>
        </View>
      </View>

      {/* <View style={styles.card}>
        <Text style={{ fontSize: 16 }}>Dashboard content goes here</Text>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 28,
    paddingBottom: 100,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  card: {
    marginTop: 24,

    padding: 24,

    borderRadius: 16,

    backgroundColor: "#FFFFFF",
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingTop: Platform.OS === "ios" ? 48 : 8,
  },
  greeting: { fontSize: 14, fontWeight: "500" },
  userName: { fontSize: 26, fontWeight: "800", marginTop: 2 },
});