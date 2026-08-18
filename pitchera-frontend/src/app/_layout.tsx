import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

import { Stack } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import Head from "expo-router/head";
import { useFonts } from "expo-font";

import {
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_400Regular_Italic,
} from "@expo-google-fonts/cormorant-garamond";

import { applyGlobalFontPatch } from "@/globalFontPatch";

import "../global.css";
import Toast from "react-native-toast-message";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_400Regular_Italic,
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
    <>
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
      </AuthProvider>
    </ThemeProvider>
    <Toast />
    </>
  );
}