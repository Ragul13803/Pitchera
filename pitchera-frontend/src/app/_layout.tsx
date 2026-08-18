import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Stack } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import "../global.css";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </ThemeProvider>
  );
}