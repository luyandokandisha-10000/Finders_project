import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { getQueryFn, apiRequest } from "@/lib/query-client";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import type { User, Post } from "@shared/schema";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ROLE_COLORS: Record<string, string> = {
  Recruiter: "#8B5CF6",
  "Job Seeker": "#3B82F6",
  Intern: "#10B981",
  Hustler: "#F59E0B",
};

function Avatar({ uri, size = 80 }: { uri?: string | null; size?: number }) {
  if (uri && uri.length > 5) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: Colors.light.primary }}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#2A2A1A", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: Colors.light.primary }}>
      <Ionicons name="person" size={size * 0.4} color={Colors.light.primary} />
    </View>
  );
}

function PostMini({ post }: { post: Post }) {
  return (
    <View style={styles.postMini}>
      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.postMiniImg} contentFit="cover" />
      ) : null}
      <Text style={styles.postMiniText} numberOfLines={3}>{post.content}</Text>
      <View style={styles.postMiniStats}>
        <Ionicons name="heart-outline" size={12} color="#888" />
        <Text style={styles.postMiniStat}>{post.likes ?? 0}</Text>
      </View>
    </View>
  );
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [hiringLoading, setHiringLoading] = useState(false);
  const [messagingLoading, setMessagingLoading] = useState(false);

  const { data: profileUser, isLoading: loadingUser } = useQuery<User>({
    queryKey: [`/api/profile/${id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!id,
  });

  const { data: userPosts } = useQuery<Post[]>({
    queryKey: [`/api/posts?userId=${id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!id,
  });

  const handleMessage = async () => {
    if (!currentUser) { router.push("/auth"); return; }
    setMessagingLoading(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const conv = await apiRequest("POST", "/api/conversations", { targetUserId: id });
      router.push(`/conversation/${conv.id}`);
    } catch {
      Alert.alert("Error", "Could not start conversation. Please try again.");
    } finally {
      setMessagingLoading(false);
    }
  };

  const handleZoomCall = async () => {
    const link = ((profileUser as any)?.zoomLink || "").trim();
    if (!link) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Linking.openURL(link);
    } catch {
      Alert.alert("Could not open Zoom", "The link may be invalid.");
    }
  };

  const handleHire = async () => {
    if (!currentUser) { router.push("/auth"); return; }
    setHiringLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await apiRequest("POST", `/api/users/${id}/hire`, {});
      Alert.alert("Request Sent!", `${profileUser?.fullName || "This user"} has been notified of your interest.`);
    } catch {
      Alert.alert("Error", "Could not send hire request.");
    } finally {
      setHiringLoading(false);
    }
  };

  const roleColor = ROLE_COLORS[profileUser?.role || ""] || Colors.light.primary;
  const isOwnProfile = currentUser?.id === id;
  const isOwner = !!(currentUser as any)?.isOwner;
  const queryClient = useQueryClient();

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete this account?",
      `This will permanently remove ${profileUser?.fullName || "this user"} along with their posts, replies, messages and jobs.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest("DELETE", `/api/users/${id}`);
              queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
              queryClient.invalidateQueries({ queryKey: ["/api/users"] });
              router.back();
            } catch (e: any) {
              Alert.alert("Failed", e?.message || "Could not delete account");
            }
          },
        },
      ],
    );
  };

  if (loadingUser) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={48} color="#555" />
        <Text style={styles.notFound}>User not found</Text>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingBottom: Platform.OS === "web" ? 34 + 16 : insets.bottom + 16,
      }}
    >
      <View style={styles.heroSection}>
        <View style={styles.heroPattern} />
        <View style={styles.avatarWrapper}>
          <Avatar uri={profileUser.avatarUrl} size={88} />
        </View>
        <Text style={styles.name}>{profileUser.fullName || "User"}</Text>
        {profileUser.role ? (
          <View style={[styles.rolePill, { backgroundColor: roleColor + "20", borderColor: roleColor + "40" }]}>
            <Text style={[styles.rolePillText, { color: roleColor }]}>{profileUser.role}</Text>
          </View>
        ) : null}
        {profileUser.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.locationText}>{profileUser.location}</Text>
          </View>
        ) : null}
      </View>

      {!isOwnProfile && currentUser && (
        <>
          <View style={styles.actionRow}>
            <Pressable
              style={[styles.actionPrimary, messagingLoading && { opacity: 0.6 }]}
              onPress={handleMessage}
              disabled={messagingLoading}
            >
              {messagingLoading ? (
                <ActivityIndicator size="small" color={Colors.light.dark} />
              ) : (
                <>
                  <Ionicons name="chatbubble" size={18} color={Colors.light.dark} />
                  <Text style={styles.actionPrimaryText}>Message</Text>
                </>
              )}
            </Pressable>
            <Pressable
              style={[styles.actionSecondary, hiringLoading && { opacity: 0.6 }]}
              onPress={handleHire}
              disabled={hiringLoading}
            >
              {hiringLoading ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <>
                  <Ionicons name="briefcase-outline" size={18} color={Colors.light.primary} />
                  <Text style={styles.actionSecondaryText}>Hire</Text>
                </>
              )}
            </Pressable>
          </View>
          {((profileUser as any)?.zoomLink || "").trim().length > 0 && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Pressable
                style={({ pressed }) => [styles.zoomCallBtn, pressed && { opacity: 0.85 }]}
                onPress={handleZoomCall}
                testID="user-zoom-call"
              >
                <Ionicons name="videocam" size={18} color={Colors.light.dark} />
                <Text style={styles.zoomCallBtnText}>
                  Join {profileUser.fullName ? `${profileUser.fullName.split(" ")[0]}'s` : "their"} Zoom Room
                </Text>
              </Pressable>
            </View>
          )}
          {isOwner && (
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <Pressable
                style={({ pressed }) => [styles.deleteAccountBtn, pressed && { opacity: 0.85 }]}
                onPress={handleDeleteAccount}
                testID="delete-user-account"
              >
                <Ionicons name="trash" size={18} color="#fff" />
                <Text style={styles.deleteAccountBtnText}>Delete Account</Text>
              </Pressable>
            </View>
          )}
        </>
      )}

      {profileUser.bio ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bioText}>{profileUser.bio}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsGrid}>
          {(profileUser as any).phone ? (
            <View style={styles.detailItem}>
              <Ionicons name="call-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.detailText}>{(profileUser as any).phone}</Text>
            </View>
          ) : null}
          {profileUser.location ? (
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color={Colors.light.primary} />
              <Text style={styles.detailText}>{profileUser.location}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {profileUser.skills ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.skillsWrap}>
            {profileUser.skills.split(",").map((s, i) => (
              <View key={i} style={styles.skillChip}>
                <Text style={styles.skillText}>{s.trim()}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {userPosts && userPosts.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Posts</Text>
          {userPosts.map((post) => (
            <PostMini key={post.id} post={post} />
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 14, backgroundColor: "#111111" },
  notFound: { fontFamily: "Inter_500Medium", fontSize: 16, color: "#888" },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#1E1E1E", borderRadius: 10 },
  backBtnText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.primary },
  heroSection: {
    alignItems: "center", paddingTop: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: "#1E1E1E", position: "relative", overflow: "hidden",
  },
  heroPattern: {
    position: "absolute", top: 0, left: 0, right: 0, height: 70,
    backgroundColor: Colors.light.primary + "10",
  },
  avatarWrapper: { marginBottom: 12, zIndex: 1 },
  name: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF", marginBottom: 6 },
  rolePill: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20,
    borderWidth: 1, marginBottom: 8,
  },
  rolePillText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888" },
  actionRow: { flexDirection: "row", gap: 10, padding: 16 },
  actionPrimary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 13,
  },
  actionPrimaryText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.light.dark },
  actionSecondary: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: Colors.light.primary, borderRadius: 12, paddingVertical: 13,
  },
  actionSecondaryText: { fontFamily: "Inter_700Bold", fontSize: 15, color: Colors.light.primary },
  zoomCallBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 12,
  },
  zoomCallBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: Colors.light.dark },
  deleteAccountBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#E74C3C", borderRadius: 12, paddingVertical: 12,
  },
  deleteAccountBtnText: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#fff" },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1A1A1A" },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.light.primary, marginBottom: 10 },
  bioText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#CCC", lineHeight: 22 },
  detailsGrid: { gap: 10 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#CCC" },
  skillsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: "#2A2A1A", borderRadius: 20, borderWidth: 1, borderColor: "#333" },
  skillText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.primary },
  postMini: { backgroundColor: "#1E1E1E", borderRadius: 12, padding: 12, marginBottom: 10, gap: 8 },
  postMiniImg: { width: "100%", height: 120, borderRadius: 8 },
  postMiniText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#CCC", lineHeight: 19 },
  postMiniStats: { flexDirection: "row", alignItems: "center", gap: 4 },
  postMiniStat: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#888" },
});
