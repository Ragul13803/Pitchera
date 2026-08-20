import React, { ReactNode } from "react";
import {
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Chatbot from "@/components/ChatBot";
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
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.container,
          !isDesktop && styles.mobileContainer,
        ]}
      >
        {/* Desktop Sidebar */}
        {isDesktop && <Sidebar />}

        {/* Main Area */}
        <View style={styles.main}>
          <TopBar />

          {/* Content Card */}
          <View
            style={[
              styles.content,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
              !isDesktop && styles.mobileContent,
            ]}
          >
            {children}
          </View>
        </View>

        {/* Mobile Bottom Tabs */}
        {!isDesktop && <MobileTabs />}

        {/* Chatbot */}
        <Chatbot />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  // Desktop: sidebar + main
  // Mobile: main + bottom tabs
  container: {
    flex: 1,
    flexDirection: "row",
  },

  mobileContainer: {
    flexDirection: "column",
  },

  main: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
  },

  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,

    // Desktop spacing
    marginRight: 10,
    marginBottom: 10,

    borderWidth: 1,
    borderRadius: 10,

    overflow: "hidden",
  },

  // Mobile content:
  // 360px screen -> 10px left + 10px right
  // = 340px available content width
  mobileContent: {
    marginLeft: 8,
    marginRight: 8,
    marginBottom: 10,

    // Center the children horizontally
    alignItems: "center",
  },
});