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
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export default function CreatePostScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/posts", { content: content.trim(), type: "general" });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      router.back();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={18} color={Colors.light.primary} />
          </View>
          <Text style={styles.userName}>{user?.fullName || "You"}</Text>
        </View>

        <TextInput
          style={styles.contentInput}
          placeholder="Share an update, opportunity, or insight..."
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholderTextColor="#666"
          autoFocus
        />

        <Pressable
          style={({ pressed }) => [
            styles.postBtn,
            pressed && { opacity: 0.85 },
            (!content.trim() || loading) && { opacity: 0.5 },
          ]}
          onPress={handlePost}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.light.dark} />
          ) : (
            <Text style={styles.postBtnText}>Publish</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111111",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  contentInput: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#333",
    padding: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#FFFFFF",
    minHeight: 180,
    lineHeight: 22,
  },
  postBtn: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  postBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.light.dark,
  },
});
