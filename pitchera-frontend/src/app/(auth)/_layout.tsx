import {
  ActivityIndicator,
  View,
} from "react-native";
import {
  Redirect,
  Slot,
} from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function AuthLayout() {
  const {
    isLoading,
    isAuthenticated,
  } = useAuth();

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

  // Token + user already exist
  // Don't show login/signup/forgot password
  if (isAuthenticated) {
    return (
      <Redirect href="/(app)/dashboard" />
    );
  }

  return <Slot />;
}