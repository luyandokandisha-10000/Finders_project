import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (!isLogin && !fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register(email.trim(), password, fullName.trim());
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message || "Something went wrong";
      const cleanMsg = msg.includes(":") ? msg.split(": ").slice(1).join(": ") : msg;
      setError(cleanMsg);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Platform.OS === "web" ? 67 + 40 : insets.top + 40,
            paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 20,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="briefcase" size={40} color={Colors.light.primary} />
          </View>
          <Text style={styles.appName}>WorkHub</Text>
          <Text style={styles.tagline}>
            Connect with opportunities that matter
          </Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.formTitle}>
            {isLogin ? "Welcome back" : "Create your account"}
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={Colors.light.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                placeholderTextColor={Colors.light.textSecondary}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.light.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholderTextColor={Colors.light.textSecondary}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={Colors.light.textSecondary}
              />
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && styles.submitBtnPressed,
              loading && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isLogin ? "Sign In" : "Create Account"}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.footerSection}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </Text>
          <Pressable onPress={toggleMode}>
            <Text style={styles.footerLink}>
              {isLogin ? "Sign Up" : "Sign In"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  formSection: {
    gap: 14,
  },
  formTitle: {
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
    color: Colors.light.text,
    marginBottom: 6,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.danger,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.light.text,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 6,
  },
  submitBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    gap: 6,
  },
  footerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  footerLink: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
});
