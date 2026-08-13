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
} from "react-native";

import { Colors } from "@/constants/theme";
import { Input } from "@/components/ui/Input";
import { authService } from "@/services/auth.service";
import { ApiError } from "@/services/api";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const { login } = useAuth(); // ✅ Get login from context
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Validation Error", "Please enter your email address");
      return;
    }

    if (!password) {
      Alert.alert("Validation Error", "Please enter your password");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Validation Error", "Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      // ✅ Import authService and call it, then use context's login
      const { authService } = await import('@/services/auth.service');
      
      const result = await authService.login({
        email: email.toLowerCase().trim(),
        password,
      });

      // ✅ Update AuthContext state too
      await login(result.tokens, result.user);

      console.log("✅ Login successful:", result.user.email);
      router.replace("/(app)/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. Please check your credentials.";
      if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };


  const isFormValid = email.trim() && password;

  return (
    <View style={styles.screen}>
      <View style={styles.backgroundCircleOne} />
      <View style={styles.backgroundCircleTwo} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Logo */}
            <View style={styles.brandContainer}>
              <View style={styles.brandIcon}>
                <Text style={styles.brandIconText}>P</Text>
              </View>
              <Text style={styles.logo}>Pitchera</Text>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue to your account
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
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
                    onPress={() => setShowPassword((prev) => !prev)}
                    hitSlop={12}
                    style={styles.eyeButton}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={21}
                      color={loading ? Colors.gray300 : Colors.gray500}
                    />
                  </Pressable>
                }
              />

              <Pressable
                style={styles.forgotButton}
                onPress={() => router.push("/forgot-password")}
                hitSlop={8}
                disabled={loading}
              >
                <Text
                  style={[styles.forgotText, loading && styles.disabledText]}
                >
                  Forgot password?
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && !loading && styles.buttonPressed,
                  (!isFormValid || loading) && styles.buttonDisabled,
                ]}
                onPress={handleLogin}
                disabled={!isFormValid || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign in</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </>
                )}
              </Pressable>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <View style={styles.orContainer}>
                <Text style={styles.orText}>OR</Text>
              </View>
              <View style={styles.divider} />
            </View>

            {/* Google Login */}
            <GoogleLoginButton
              onLoading={setLoading}
              disabled={loading}
            />

            {/* Sign Up */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account?</Text>
              <Pressable
                onPress={() => router.push("/sign-up")}
                hitSlop={8}
                disabled={loading}
              >
                <Text
                  style={[styles.signupLink, loading && styles.disabledText]}
                >
                  Create account
                </Text>
              </Pressable>
            </View>

            {/* Terms */}
            <Text style={styles.terms}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink}>Terms of Service</Text> and{" "}
              <Text style={styles.termsLink}>Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: "#F6F8FC" },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  backgroundCircleOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#DBEAFE",
    top: -120,
    right: -100,
    opacity: 0.6,
  },
  backgroundCircleTwo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#EDE9FE",
    bottom: -80,
    left: -100,
    opacity: 0.7,
  },
  card: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderWidth: 1,
    borderColor: "#E8ECF2",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 30,
    elevation: 5,
  },
  brandContainer: { alignItems: "center", marginBottom: 28 },
  brandIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  brandIconText: { color: "#FFFFFF", fontSize: 25, fontWeight: "800" },
  logo: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    letterSpacing: -0.5,
  },
  header: { alignItems: "center", marginBottom: 28 },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: -0.7,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#64748B",
    textAlign: "center",
    maxWidth: 300,
  },
  form: { width: "100%" },
  eyeButton: { alignItems: "center", justifyContent: "center" },
  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -6,
    marginBottom: 18,
  },
  forgotText: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  disabledText: { opacity: 0.5 },
  loginButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 3,
  },
  loginButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  buttonPressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  buttonDisabled: { opacity: 0.5 },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  orContainer: { paddingHorizontal: 14 },
  orText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 26,
  },
  signupText: { fontSize: 13, color: "#64748B" },
  signupLink: {
    marginLeft: 5,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.primary,
  },
  terms: {
    marginTop: 22,
    fontSize: 11,
    lineHeight: 17,
    color: "#94A3B8",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  termsLink: { color: "#64748B", fontWeight: "600" },
});