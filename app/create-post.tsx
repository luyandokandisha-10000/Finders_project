import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

export default function CreatePostScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please allow access to your photo library.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.6,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const dataUri = `data:image/jpeg;base64,${asset.base64}`;
        setImageUri(dataUri);
      }
    } catch {
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/posts", {
        content: content.trim(),
        type: "general",
        imageUrl: imageUri || "",
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  const avatarUri = user?.avatarUrl && user.avatarUrl.length > 5 ? user.avatarUrl : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={18} color={Colors.light.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.fullName || "You"}</Text>
            {user?.role ? <Text style={styles.userRole}>{user.role}</Text> : null}
          </View>
          <Pressable
            style={({ pressed }) => [styles.postBtn, pressed && { opacity: 0.85 }, (!content.trim() || loading) && { opacity: 0.5 }]}
            onPress={handlePost}
            disabled={!content.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.light.dark} size="small" />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </Pressable>
        </View>

        <TextInput
          style={styles.contentInput}
          placeholder="What's on your mind? Share an update, opportunity, or insight..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#555"
          autoFocus
        />

        {imageUri ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
            <Pressable style={styles.removeImgBtn} onPress={() => setImageUri(null)}>
              <Ionicons name="close-circle" size={26} color="#FF6B6B" />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.toolbarRow}>
          <Pressable style={styles.toolBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={22} color="#888" />
            <Text style={styles.toolBtnText}>Add Photo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  scrollContent: { padding: 16, gap: 14 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "#2E2E2E",
  },
  avatar: { width: 42, height: 42, borderRadius: 21 },
  avatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "#2A2A1A", alignItems: "center", justifyContent: "center",
  },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF" },
  userRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.primary },
  postBtn: {
    backgroundColor: Colors.light.primary, paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 20,
  },
  postBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.light.dark },
  contentInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 16,
    color: "#FFFFFF",
    minHeight: 160,
    lineHeight: 24,
    textAlignVertical: "top",
  },
  imagePreviewWrapper: { position: "relative", borderRadius: 14, overflow: "hidden" },
  imagePreview: { width: "100%", height: 200, borderRadius: 14 },
  removeImgBtn: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "#000000AA", borderRadius: 13,
  },
  toolbarRow: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: "#2E2E2E", paddingTop: 12, gap: 16,
  },
  toolBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 },
  toolBtnText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888" },
});
