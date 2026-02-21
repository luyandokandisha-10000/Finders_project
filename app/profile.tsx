import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLES = [
  {
    key: "Recruiter",
    icon: "people" as const,
    color: "#8B5CF6",
    bg: "#F3F0FF",
    desc: "I'm looking to hire talent",
  },
  {
    key: "Job Seeker",
    icon: "search" as const,
    color: "#2563EB",
    bg: "#EFF6FF",
    desc: "I'm looking for employment",
  },
  {
    key: "Intern",
    icon: "school" as const,
    color: "#059669",
    bg: "#ECFDF5",
    desc: "I'm seeking internship opportunities",
  },
  {
    key: "Hustler",
    icon: "rocket" as const,
    color: "#EA580C",
    bg: "#FFF7ED",
    desc: "I do freelance and gig work",
  },
];

export default function ProfileScreen() {
  const { user, updateProfile, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [role, setRole] = useState(user?.role || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [skills, setSkills] = useState(user?.skills || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ fullName, role, bio, location, skills });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={40} color={Colors.light.primary} />
        </View>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Text style={styles.sectionTitle}>Choose your role</Text>
      <View style={styles.roleGrid}>
        {ROLES.map((r) => (
          <Pressable
            key={r.key}
            style={[
              styles.roleCard,
              role === r.key && { borderColor: r.color, borderWidth: 2 },
            ]}
            onPress={() => {
              setRole(r.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: r.bg }]}>
              <Ionicons name={r.icon} size={24} color={r.color} />
            </View>
            <Text style={styles.roleCardTitle}>{r.key}</Text>
            <Text style={styles.roleCardDesc}>{r.desc}</Text>
            {role === r.key && (
              <View style={[styles.checkBadge, { backgroundColor: r.color }]}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your information</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Full Name</Text>
        <TextInput
          style={styles.fieldInput}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.light.textSecondary}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bio</Text>
        <TextInput
          style={[styles.fieldInput, styles.multilineInput]}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself"
          multiline
          textAlignVertical="top"
          placeholderTextColor={Colors.light.textSecondary}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput
          style={styles.fieldInput}
          value={location}
          onChangeText={setLocation}
          placeholder="City, Country"
          placeholderTextColor={Colors.light.textSecondary}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Skills</Text>
        <TextInput
          style={styles.fieldInput}
          value={skills}
          onChangeText={setSkills}
          placeholder="e.g. JavaScript, Design, Marketing"
          placeholderTextColor={Colors.light.textSecondary}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.saveBtn,
          pressed && styles.saveBtnPressed,
          saving && styles.saveBtnDisabled,
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Profile</Text>
        )}
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.light.danger} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 16,
    gap: 10,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
  },
  email: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 17,
    color: Colors.light.text,
    marginTop: 4,
  },
  roleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  roleCard: {
    width: "47%",
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
    position: "relative",
  },
  roleIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  roleCardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  roleCardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  checkBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  fieldInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  saveBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  logoutText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
    color: Colors.light.danger,
  },
});
