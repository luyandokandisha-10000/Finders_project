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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

const ROLES = [
  { key: "Recruiter", icon: "people" as const, color: "#8B5CF6", bg: "#2A1F3D", desc: "I'm hiring talent" },
  { key: "Job Seeker", icon: "search" as const, color: "#3B82F6", bg: "#1A2640", desc: "I'm looking for a job" },
  { key: "Intern", icon: "school" as const, color: "#10B981", bg: "#1A2A20", desc: "I'm seeking an internship" },
  { key: "Hustler", icon: "rocket" as const, color: "#F59E0B", bg: "#2A2A1A", desc: "I do freelance & gig work" },
];

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleNextStep = () => {
    setError("");
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(2);
  };

  const handleLogin = async () => {
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message || "Something went wrong";
      setError(msg.includes(":") ? msg.split(": ").slice(1).join(": ") : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!selectedRole) {
      setError("Please choose your role to continue");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, fullName.trim(), selectedRole);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message || "Registration failed";
      setError(msg.includes(":") ? msg.split(": ").slice(1).join(": ") : msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setError("");
    setSelectedRole("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goBack = () => {
    setStep(1);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const topPad = Platform.OS === "web" ? 67 + 40 : insets.top + 40;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom + 20;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: topPad, paddingBottom: botPad }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="search" size={36} color={Colors.light.dark} />
          </View>
          <Text style={styles.appName}>Finders</Text>
          <Text style={styles.tagline}>Find your next opportunity. Get found.</Text>
        </View>

        {!isLogin && step === 2 ? (
          <View style={styles.formSection}>
            <Pressable style={styles.backRow} onPress={goBack}>
              <Ionicons name="arrow-back" size={20} color={Colors.light.primary} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <Text style={styles.formTitle}>Choose your role</Text>
            <Text style={styles.roleSubtitle}>
              This defines your experience on Finders and cannot be changed later.
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.roleGrid}>
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.key;
                return (
                  <Pressable
                    key={role.key}
                    style={[
                      styles.roleCard,
                      { borderColor: isSelected ? role.color : "#333" },
                      isSelected && { backgroundColor: role.bg },
                    ]}
                    onPress={() => {
                      setSelectedRole(role.key);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                  >
                    <View style={[styles.roleIcon, { backgroundColor: role.bg }]}>
                      <Ionicons name={role.icon} size={24} color={role.color} />
                    </View>
                    <Text style={[styles.roleTitle, isSelected && { color: role.color }]}>
                      {role.key}
                    </Text>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                    {isSelected && (
                      <View style={[styles.roleCheck, { backgroundColor: role.color }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                (!selectedRole || loading) && { opacity: 0.5 },
              ]}
              onPress={handleRegister}
              disabled={!selectedRole || loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.light.dark} />
              ) : (
                <Text style={styles.submitBtnText}>Create Account</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.formSection}>
            <Text style={styles.formTitle}>
              {isLogin ? "Welcome back" : "Create your account"}
            </Text>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {!isLogin && (
              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  placeholderTextColor="#555"
                />
              </View>
            )}

            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#555"
              />
            </View>

            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#555"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.light.primary}
                />
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && { opacity: 0.85 },
                loading && { opacity: 0.5 },
              ]}
              onPress={isLogin ? handleLogin : handleNextStep}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.light.dark} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isLogin ? "Sign In" : "Next: Choose Role"}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </Text>
          <Pressable onPress={switchMode}>
            <Text style={styles.footerLink}>
              {isLogin ? "Sign up" : "Sign in"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  scrollContent: { padding: 24, gap: 24 },
  logoSection: { alignItems: "center", gap: 10 },
  logoCircle: {
    width: 76, height: 76, borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
  },
  appName: { fontFamily: "Inter_700Bold", fontSize: 32, color: "#FFFFFF" },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
  formSection: { gap: 14 },
  formTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: "#FFFFFF", marginBottom: 4 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FF6B6B20", borderRadius: 10, borderWidth: 1, borderColor: "#FF6B6B40",
    padding: 12,
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#FF6B6B", flex: 1 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1E1E1E", borderRadius: 12,
    borderWidth: 1, borderColor: "#2E2E2E", paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: {
    flex: 1, paddingVertical: 15,
    fontFamily: "Inter_400Regular", fontSize: 16, color: "#FFFFFF",
  },
  eyeBtn: {
    padding: 8,
    marginRight: -4,
    borderRadius: 8,
  },
  submitBtn: {
    backgroundColor: Colors.light.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: "center", marginTop: 4,
  },
  submitBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.light.dark },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 },
  footerText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888" },
  footerLink: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.light.primary },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.primary },
  roleSubtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888", lineHeight: 19 },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleCard: {
    width: "47%", backgroundColor: "#1E1E1E", borderRadius: 14,
    padding: 14, borderWidth: 2, borderColor: "#333",
    gap: 6, position: "relative",
  },
  roleIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  roleTitle: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#FFFFFF" },
  roleDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#AAA", lineHeight: 15 },
  roleCheck: {
    position: "absolute", top: 10, right: 10,
    width: 24, height: 24, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
});
