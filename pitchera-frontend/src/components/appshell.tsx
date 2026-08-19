import React, { ReactNode } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Chatbot from '@/components/ChatBot'
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { MobileTabs } from "./mobile-tabs";
import { useTheme } from "@/context/ThemeContext";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  const isDesktop = width >= 900;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {isDesktop && <Sidebar />}

        <View style={styles.main}>
          <TopBar />

          {/* Content Card */}
          <View
            style={[
              styles.content,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {children}
          </View>
        </View>

        {!isDesktop && <MobileTabs />}

        {/* Chatbot - available on desktop + mobile */}
        <Chatbot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
    flexDirection: "row",
  },

  main: {
    flex: 1,
    minWidth: 0,
  },

  content: {
    flex: 1,

    minWidth: 0,

    marginRight: 10,
    marginBottom: 10,

    borderWidth: 1,

    borderRadius: 10,

    overflow: "hidden",
  },
});