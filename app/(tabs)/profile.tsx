import React, { useState } from "react";
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
import { Image } from "expo-image";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLES = [
  { key: "Recruiter", icon: "people" as const, color: "#8B5CF6", bg: "#2A1F3D", desc: "I'm looking to hire talent" },
  { key: "Job Seeker", icon: "search" as const, color: "#3B82F6", bg: "#1A2640", desc: "I'm looking for employment" },
  { key: "Intern", icon: "school" as const, color: "#10B981", bg: "#1A2A20", desc: "I'm seeking internships" },
  { key: "Hustler", icon: "rocket" as const, color: "#F59E0B", bg: "#2A2A1A", desc: "I do freelance & gig work" },
];

export default function ProfileTab() {
  const { user, updateProfile, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [role, setRole] = useState(user?.role || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [skills, setSkills] = useState(user?.skills || "");
  const [phone, setPhone] = useState((user as any)?.phone || "");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const pickPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = `data:image/jpeg;base64,${asset.base64}`;
        setUploadingPhoto(true);
        try {
          await updateProfile({ avatarUrl: dataUri } as any);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          Alert.alert("Error", "Failed to upload photo. Please try again.");
        } finally {
          setUploadingPhoto(false);
        }
      }
    } catch {
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ fullName, role, bio, location, skills, phone } as any);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Saved", "Your profile has been updated.");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const avatarUri = user?.avatarUrl && user.avatarUrl.length > 5 ? user.avatarUrl : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20 },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.avatarSection}>
        <Pressable onPress={pickPhoto} disabled={uploadingPhoto} style={styles.avatarPress}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={44} color={Colors.light.primary} />
            </View>
          )}
          <View style={styles.cameraOverlay}>
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="camera" size={18} color="#fff" />
            )}
          </View>
        </Pressable>
        <Text style={styles.emailText}>{user?.email}</Text>
        <Text style={styles.tapHint}>Tap photo to change</Text>
      </View>

      <Text style={styles.sectionTitle}>Your Role</Text>
      <View style={styles.roleGrid}>
        {ROLES.map((r) => (
          <Pressable
            key={r.key}
            style={[styles.roleCard, role === r.key && { borderColor: r.color, borderWidth: 2 }]}
            onPress={() => {
              setRole(r.key);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <View style={[styles.roleIconCircle, { backgroundColor: r.bg }]}>
              <Ionicons name={r.icon} size={22} color={r.color} />
            </View>
            <Text style={styles.roleCardTitle}>{r.key}</Text>
            <Text style={styles.roleCardDesc}>{r.desc}</Text>
            {role === r.key && (
              <View style={[styles.checkBadge, { backgroundColor: r.color }]}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your Information</Text>

      {[
        { label: "Full Name", value: fullName, onChange: setFullName, placeholder: "Enter your full name", icon: "person-outline" as const },
        { label: "Phone", value: phone, onChange: setPhone, placeholder: "+1 (555) 000-0000", icon: "call-outline" as const, keyboardType: "phone-pad" as const },
        { label: "Location", value: location, onChange: setLocation, placeholder: "City, Country", icon: "location-outline" as const },
        { label: "Skills", value: skills, onChange: setSkills, placeholder: "JavaScript, Design, Marketing...", icon: "star-outline" as const },
      ].map((field) => (
        <View key={field.label} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.fieldRow}>
            <Ionicons name={field.icon} size={18} color="#666" style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              value={field.value}
              onChangeText={field.onChange}
              placeholder={field.placeholder}
              placeholderTextColor="#555"
              keyboardType={(field as any).keyboardType || "default"}
            />
          </View>
        </View>
      ))}

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Bio</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself..."
          multiline
          textAlignVertical="top"
          placeholderTextColor="#555"
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.light.dark} />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color={Colors.light.dark} />
            <Text style={styles.saveBtnText}>Save Profile</Text>
          </>
        )}
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  scrollContent: { padding: 16, gap: 16 },
  avatarSection: { alignItems: "center", paddingVertical: 12, gap: 6 },
  avatarPress: { position: "relative" },
  avatarImg: { width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: Colors.light.primary },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#2A2A1A",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#333",
  },
  cameraOverlay: {
    position: "absolute", bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#111111",
  },
  emailText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#AAA" },
  tapHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#666" },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold", fontSize: 16,
    color: Colors.light.primary, marginTop: 4,
  },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleCard: {
    width: "47%", backgroundColor: "#1E1E1E", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#333", gap: 6, position: "relative",
  },
  roleIconCircle: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  roleCardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  roleCardDesc: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#AAA", lineHeight: 15 },
  checkBadge: {
    position: "absolute", top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  fieldGroup: { gap: 5 },
  fieldLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#888" },
  fieldRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1E1E1E", borderRadius: 12,
    borderWidth: 1, borderColor: "#333", paddingHorizontal: 12,
  },
  fieldIcon: { marginRight: 8 },
  fieldInput: {
    flex: 1, paddingVertical: 13,
    fontFamily: "Inter_400Regular", fontSize: 15, color: "#FFFFFF",
  },
  bioInput: {
    backgroundColor: "#1E1E1E", borderRadius: 12, borderWidth: 1, borderColor: "#333",
    paddingHorizontal: 14, paddingVertical: 13,
    fontFamily: "Inter_400Regular", fontSize: 15, color: "#FFFFFF",
    minHeight: 80,
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.light.primary, borderRadius: 12,
    paddingVertical: 15, gap: 8, marginTop: 4,
  },
  saveBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.light.dark },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 16, gap: 8,
  },
  logoutText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#FF6B6B" },
});
