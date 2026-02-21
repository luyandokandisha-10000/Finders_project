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
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

const POST_TYPES = [
  { key: "general", label: "General", icon: "chatbubbles-outline" as const },
  { key: "hiring", label: "Hiring", icon: "megaphone-outline" as const },
  { key: "seeking", label: "Looking for work", icon: "search-outline" as const },
  { key: "advice", label: "Career advice", icon: "bulb-outline" as const },
];

export default function PostScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [type, setType] = useState("general");
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await apiRequest("POST", "/api/posts", { content: content.trim(), type });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setContent("");
      setType("general");
      router.push("/(tabs)");
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create post. Please try again.");
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
          <View>
            <Text style={styles.userName}>{user?.fullName || "You"}</Text>
            <Text style={styles.userRole}>{user?.role || "Member"}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Post type</Text>
        <View style={styles.typeRow}>
          {POST_TYPES.map((t) => (
            <Pressable
              key={t.key}
              style={[
                styles.typeChip,
                type === t.key && styles.typeChipActive,
              ]}
              onPress={() => {
                setType(t.key);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons
                name={t.icon}
                size={16}
                color={type === t.key ? Colors.light.primary : "#888"}
              />
              <Text
                style={[
                  styles.typeChipText,
                  type === t.key && styles.typeChipTextActive,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.contentInput}
            placeholder="What's on your mind? Share updates, opportunities, or advice..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#888"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.postBtn,
            pressed && styles.postBtnPressed,
            (!content.trim() || loading) && styles.postBtnDisabled,
          ]}
          onPress={handlePost}
          disabled={!content.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.light.dark} />
          ) : (
            <>
              <Ionicons name="send" size={18} color={Colors.light.dark} />
              <Text style={styles.postBtnText}>Publish</Text>
            </>
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
    gap: 12,
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2A2A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  userRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#888",
  },
  sectionLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#333",
    gap: 5,
  },
  typeChipActive: {
    backgroundColor: "#2A2A1A",
    borderColor: Colors.light.primary,
  },
  typeChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: "#888",
  },
  typeChipTextActive: {
    color: Colors.light.primary,
  },
  inputContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#333",
    minHeight: 160,
  },
  contentInput: {
    padding: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#FFFFFF",
    minHeight: 160,
    lineHeight: 22,
  },
  postBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  postBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
  postBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 16,
    color: Colors.light.dark,
  },
});
