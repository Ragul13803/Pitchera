import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Head from "expo-router/head";
import { useFonts } from "expo-font";

import { Alkatra_400Regular } from "@expo-google-fonts/alkatra";

import { applyGlobalFontPatch } from "@/globalFontPatch";

import "../global.css";
import Toast from "react-native-toast-message";
import { toastConfig } from "@/components/ui/toastConfig";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Alkatra_400Regular,
  });

  if (fontError) {
    console.error("Font loading error:", fontError);
    return null;
  }

  if (!fontsLoaded) {
    return null;
  }

  applyGlobalFontPatch();

  return (
    <ThemeProvider>
      <AuthProvider>
        <Head>
          <title>Pitchera</title>
        </Head>

        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />

        <Toast
          config={toastConfig}
          position="top"
          topOffset={20}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}