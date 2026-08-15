import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GoogleLoginButton from "@/components/GoogleLoginButton";
import PITCHERA_LOGO from "@/assets/images/pitchera_logo.png";
import { useDeviceType } from "@/hooks/useDeviceType";

export default function Login() {
  const { width } = useDeviceType();
  const [loading, setLoading] = useState(false);

  const isSmallPhone = width < 360;
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 900;
  const isDesktop = width >= 900;

  const horizontalPadding = isSmallPhone
    ? 16
    : isPhone
      ? 20
      : isTablet
        ? 32
        : 40;

  const cardPadding = isSmallPhone
    ? 22
    : isPhone
      ? 26
      : 32;

  const handleGoogleLoading = (value: boolean) => {
    setLoading(value);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <View style={styles.screen}>
        {/* Background decoration */}
        <View
          style={[
            styles.circleTop,
            {
              width: isPhone ? 220 : 300,
              height: isPhone ? 220 : 300,
              borderRadius: isPhone ? 110 : 150,
            },
          ]}
        />

        <View
          style={[
            styles.circleBottom,
            {
              width: isPhone ? 190 : 250,
              height: isPhone ? 190 : 250,
              borderRadius: isPhone ? 95 : 125,
            },
          ]}
        />

        <View
          style={[
            styles.content,
            {
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <View
            style={[
              styles.card,
              {
                padding: cardPadding,
                maxWidth: isDesktop ? 430 : isTablet ? 460 : 500,
              },
            ]}
          >
            {/* Logo */}
            <View style={styles.brand}>
              <Image
                source={PITCHERA_LOGO}
                style={[
                  styles.logoImage,
                  {
                    width: isSmallPhone ? 58 : 68,
                    height: isSmallPhone ? 48 : 56,
                  },
                ]}
                resizeMode="contain"
              />

              <Text
                style={[
                  styles.logoText,
                  {
                    fontSize: isSmallPhone ? 20 : 22,
                  },
                ]}
              >
                Pitchera
              </Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: isSmallPhone ? 24 : isPhone ? 26 : 28,
                  },
                ]}
              >
                Welcome back
              </Text>

              <Text style={styles.subtitle}>
                Sign in to continue
              </Text>
            </View>

            {/* Google Sign In */}
            <View style={styles.googleContainer}>
              <GoogleLoginButton
                onLoading={handleGoogleLoading}
                disabled={loading}
              />
            </View>

            {/* Security message */}
            <View style={styles.securityContainer}>
              <View style={styles.securityDot} />

              <Text style={styles.securityText}>
                Secure sign-in with Google
              </Text>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© Pitchera</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F6F8FC",
    overflow: "hidden",
  },

  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Background */

  circleTop: {
    position: "absolute",
    top: -120,
    right: -90,
    backgroundColor: "#DBEAFE",
    opacity: 0.65,
  },

  circleBottom: {
    position: "absolute",
    bottom: -100,
    left: -90,
    backgroundColor: "#EDE9FE",
    opacity: 0.7,
  },

  /* Card */

  card: {
    width: "100%",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 26,

    borderWidth: 1,
    borderColor: "#E8ECF2",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowOpacity: 0.08,
    shadowRadius: 30,

    elevation: 6,
  },

  /* Brand */

  brand: {
    alignItems: "center",
    marginBottom: 12,
  },

  logoImage: {
    marginBottom: 8,
    borderRadius: 8
  },

  logoText: {
    color: "#111827",
    fontWeight: "800",
    letterSpacing: -0.6,
  },

  /* Header */

  header: {
    alignItems: "center",
    marginBottom: 16,
  },

  title: {
    color: "#0F172A",
    fontWeight: "800",
    letterSpacing: -0.8,
    textAlign: "center",
  },

  subtitle: {
    marginTop: 9,

    color: "#64748B",

    fontSize: 14,
    lineHeight: 21,

    textAlign: "center",
  },

  /* Google */

  googleContainer: {
    width: "100%",
  },

  /* Security */

  securityContainer: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 20,
  },

  securityDot: {
    width: 7,
    height: 7,

    marginRight: 7,

    borderRadius: 4,

    backgroundColor: "#22C55E",
  },

  securityText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },

  /* Terms */

  terms: {
    marginTop: 24,

    paddingHorizontal: 8,

    color: "#94A3B8",

    fontSize: 11,
    lineHeight: 17,

    textAlign: "center",
  },

  termsLink: {
    color: "#64748B",
    fontWeight: "600",
  },

  /* Footer */

  footer: {
    position: "absolute",
    bottom: 18,

    color: "#CBD5E1",

    fontSize: 11,
    fontWeight: "500",
  },
});