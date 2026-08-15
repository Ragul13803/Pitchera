import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/theme";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const { width } = useWindowDimensions();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /*
   * Responsive breakpoints
   */
  const isSmallPhone = width < 360;
  const isPhone = width < 600;
  const isTablet = width >= 600 && width < 900;
  const isDesktop = width >= 900;

  const horizontalPadding = isSmallPhone
    ? 12
    : isPhone
      ? 16
      : isTablet
        ? 32
        : 40;

  const cardPaddingHorizontal = isSmallPhone
    ? 18
    : isPhone
      ? 22
      : 28;

  const cardPaddingVertical = isSmallPhone
    ? 24
    : isPhone
      ? 28
      : 32;

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Validation Error",
        "Please enter your email address"
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Validation Error",
        "Please enter your password"
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid email address"
      );
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      await login(result.tokens, result.user);

      console.log(
        "✅ Login successful:",
        result.user.email
      );

      router.replace("/(app)/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage =
        "Login failed. Please check your credentials.";

      if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert(
        "Login Failed",
        errorMessage
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    email.trim().length > 0 &&
    password.length > 0;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom"]}
    >
      <View style={styles.screen}>

        {/* Background Decorations */}

        <View
          style={[
            styles.backgroundCircleOne,
            {
              width: isPhone ? 220 : 280,
              height: isPhone ? 220 : 280,
              borderRadius: isPhone ? 110 : 140,
            },
          ]}
        />

        <View
          style={[
            styles.backgroundCircleTwo,
            {
              width: isPhone ? 180 : 220,
              height: isPhone ? 180 : 220,
              borderRadius: isPhone ? 90 : 110,
            },
          ]}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : "height"
          }
          keyboardVerticalOffset={
            Platform.OS === "ios" ? 0 : 20
          }
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              {
                paddingHorizontal: horizontalPadding,
              },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios"
                ? "interactive"
                : "on-drag"
            }
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
            bounces={false}
          >
            <View
              style={[
                styles.card,
                {
                  paddingHorizontal:
                    cardPaddingHorizontal,

                  paddingVertical:
                    cardPaddingVertical,

                  /*
                   * On mobile the card takes the available width.
                   * On larger screens it stays nicely constrained.
                   */
                  maxWidth: isDesktop
                    ? 430
                    : isTablet
                      ? 460
                      : 500,
                },
              ]}
            >
              {/* Logo */}

              <View style={styles.brandContainer}>
                <View
                  style={[
                    styles.brandIcon,
                    {
                      width: isSmallPhone ? 46 : 52,
                      height: isSmallPhone ? 46 : 52,
                      borderRadius: isSmallPhone
                        ? 14
                        : 16,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.brandIconText,
                      {
                        fontSize: isSmallPhone
                          ? 22
                          : 25,
                      },
                    ]}
                  >
                    P
                  </Text>
                </View>

                <Text
                  style={[
                    styles.logo,
                    {
                      fontSize: isSmallPhone
                        ? 19
                        : 20,
                    },
                  ]}
                >
                  Pitchera
                </Text>
              </View>

              {/* Header */}

              <View
                style={[
                  styles.header,
                  {
                    marginBottom: isSmallPhone
                      ? 22
                      : 28,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.title,
                    {
                      fontSize: isSmallPhone
                        ? 24
                        : isPhone
                          ? 26
                          : 28,

                      lineHeight: isSmallPhone
                        ? 30
                        : isPhone
                          ? 32
                          : 34,
                    },
                  ]}
                >
                  Welcome back
                </Text>

                <Text
                  style={[
                    styles.subtitle,
                    {
                      fontSize: isSmallPhone
                        ? 13
                        : 14,
                    },
                  ]}
                >
                  Sign in to continue to your account
                </Text>
              </View>

              {/* Form */}

              <View style={styles.form}>

                {/* Email */}

                <Input
                  label="Email address"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  required
                />

                {/* Password */}

                <Input
                  label="Password"
                  placeholder="Enter your password"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                  required
                  rightIcon={
                    <Pressable
                      onPress={() =>
                        setShowPassword(
                          (prev) => !prev
                        )
                      }
                      hitSlop={12}
                      style={styles.eyeButton}
                      disabled={loading}
                    >
                      <Ionicons
                        name={
                          showPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={21}
                        color={
                          loading
                            ? Colors.gray300
                            : Colors.gray500
                        }
                      />
                    </Pressable>
                  }
                />

                {/* Forgot Password */}

                <Pressable
                  style={styles.forgotButton}
                  onPress={() =>
                    router.push(
                      "/(auth)/forgot-password"
                    )
                  }
                  hitSlop={8}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.forgotText,
                      loading &&
                        styles.disabledText,
                    ]}
                  >
                    Forgot password?
                  </Text>
                </Pressable>

                {/* Login */}

                <Pressable
                  style={({ pressed }) => [
                    styles.loginButton,

                    {
                      height: isSmallPhone
                        ? 48
                        : 52,
                    },

                    pressed &&
                      !loading &&
                      styles.buttonPressed,

                    (!isFormValid ||
                      loading) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleLogin}
                  disabled={
                    !isFormValid || loading
                  }
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />
                  ) : (
                    <>
                      <Text
                        style={
                          styles.loginButtonText
                        }
                      >
                        Sign in
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color="#FFFFFF"
                      />
                    </>
                  )}
                </Pressable>
              </View>

              {/* Divider */}

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />

                <View style={styles.orContainer}>
                  <Text style={styles.orText}>
                    OR
                  </Text>
                </View>

                <View style={styles.divider} />
              </View>

              {/* Google Login */}

              <GoogleLoginButton
                onLoading={setLoading}
                disabled={loading}
              />

              {/* Sign Up */}

              <View
                style={[
                  styles.signupContainer,
                  {
                    flexWrap:
                      isSmallPhone
                        ? "wrap"
                        : "nowrap",
                  },
                ]}
              >
                <Text
                  style={styles.signupText}
                >
                  Don't have an account?
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/(auth)/sign-up"
                    )
                  }
                  hitSlop={8}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.signupLink,
                      loading &&
                        styles.disabledText,
                    ]}
                  >
                    Create account
                  </Text>
                </Pressable>
              </View>

              {/* Terms */}

              <Text style={styles.terms}>
                By continuing, you agree to our{" "}
                <Text style={styles.termsLink}>
                  Terms of Service
                </Text>{" "}
                and{" "}
                <Text style={styles.termsLink}>
                  Privacy Policy
                </Text>
                .
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#F6F8FC",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F6F8FC",
    overflow: "hidden",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingVertical: 20,
  },

  /* ---------------- BACKGROUND ---------------- */

  backgroundCircleOne: {
    position: "absolute",

    backgroundColor: "#DBEAFE",

    top: -100,
    right: -80,

    opacity: 0.6,
  },

  backgroundCircleTwo: {
    position: "absolute",

    backgroundColor: "#EDE9FE",

    bottom: -70,
    left: -80,

    opacity: 0.7,
  },

  /* ---------------- CARD ---------------- */

  card: {
    width: "100%",

    backgroundColor: "#FFFFFF",

    borderRadius: 24,

    borderWidth: 1,
    borderColor: "#E8ECF2",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.07,
    shadowRadius: 30,

    elevation: 5,
  },

  /* ---------------- BRAND ---------------- */

  brandContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  brandIcon: {
    backgroundColor: Colors.primary,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 10,

    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,

    elevation: 4,
  },

  brandIconText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  logo: {
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },

  /* ---------------- HEADER ---------------- */

  header: {
    alignItems: "center",
  },

  title: {
    fontWeight: "800",

    color: "#0F172A",

    letterSpacing: -0.7,

    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,

    lineHeight: 21,

    color: "#64748B",

    textAlign: "center",

    maxWidth: 300,
  },

  /* ---------------- FORM ---------------- */

  form: {
    width: "100%",
  },

  eyeButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  forgotButton: {
    alignSelf: "flex-end",

    marginTop: -6,
    marginBottom: 18,
  },

  forgotText: {
    fontSize: 13,

    fontWeight: "700",

    color: Colors.primary,
  },

  disabledText: {
    opacity: 0.5,
  },

  /* ---------------- LOGIN BUTTON ---------------- */

  loginButton: {
    width: "100%",

    borderRadius: 12,

    backgroundColor: Colors.primary,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    shadowColor: Colors.primary,

    shadowOffset: {
      width: 0,
      height: 6,
    },

    shadowOpacity: 0.22,
    shadowRadius: 12,

    elevation: 3,
  },

  loginButtonText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "700",
  },

  buttonPressed: {
    opacity: 0.75,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  /* ---------------- DIVIDER ---------------- */

  dividerContainer: {
    flexDirection: "row",

    alignItems: "center",

    marginVertical: 24,
  },

  divider: {
    flex: 1,

    height: 1,

    backgroundColor: "#E5E7EB",
  },

  orContainer: {
    paddingHorizontal: 14,
  },

  orText: {
    fontSize: 11,

    fontWeight: "700",

    color: "#94A3B8",

    letterSpacing: 0.5,
  },

  /* ---------------- SIGN UP ---------------- */

  signupContainer: {
    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    marginTop: 26,

    gap: 0,
  },

  signupText: {
    fontSize: 13,

    color: "#64748B",

    textAlign: "center",
  },

  signupLink: {
    marginLeft: 5,

    fontSize: 13,

    fontWeight: "700",

    color: Colors.primary,
  },

  /* ---------------- TERMS ---------------- */

  terms: {
    marginTop: 22,

    fontSize: 11,

    lineHeight: 17,

    color: "#94A3B8",

    textAlign: "center",

    paddingHorizontal: 8,
  },

  termsLink: {
    color: "#64748B",

    fontWeight: "600",
  },
});