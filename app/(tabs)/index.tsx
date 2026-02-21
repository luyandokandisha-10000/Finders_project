import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import { getQueryFn } from "@/lib/query-client";
import type { Post, User } from "@shared/schema";

function PostCard({ post }: { post: Post & { user?: User } }) {
  const timeAgo = getTimeAgo(post.createdAt ? new Date(post.createdAt) : new Date());

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatarSmall}>
          <Ionicons name="person" size={18} color={Colors.light.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{post.user?.fullName || "User"}</Text>
          <Text style={styles.postRole}>{post.user?.role || "Member"}</Text>
        </View>
        <Text style={styles.postTime}>{timeAgo}</Text>
      </View>
      <Text style={styles.postContent}>{post.content}</Text>
      <View style={styles.postActions}>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="heart-outline" size={20} color={Colors.light.textSecondary} />
          <Text style={styles.actionText}>{post.likes || 0}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.light.textSecondary} />
          <Text style={styles.actionText}>Reply</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <Ionicons name="share-outline" size={18} color={Colors.light.textSecondary} />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function HomeScreen() {
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [user, authLoading]);

  const { data: posts, isLoading, refetch } = useQuery<(Post & { user?: User })[]>({
    queryKey: ["/api/posts"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!user) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={posts || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        contentContainerStyle={[
          styles.listContent,
          (!posts || posts.length === 0) && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.light.primary} />
        }
        scrollEnabled={!!(posts && posts.length > 0)}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share something with the community</Text>
              <Pressable
                style={styles.emptyBtn}
                onPress={() => router.push("/create-post")}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.emptyBtnText}>Create Post</Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.background,
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  emptyListContent: {
    flex: 1,
  },
  postCard: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
  },
  postAuthor: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  postRole: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  postTime: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  postContent: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 21,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
    gap: 24,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
    marginTop: 8,
  },
  emptyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#fff",
  },
});
