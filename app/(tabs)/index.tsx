import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Share,
  Animated,
  ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import type { Post, User, PostReply } from "@shared/schema";
import * as Haptics from "expo-haptics";

function Avatar({ uri, size = 40 }: { uri?: string | null; size?: number }) {
  if (uri && uri.length > 5) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#2A2A1A" }}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#2A2A1A", alignItems: "center", justifyContent: "center" }}>
      <Ionicons name="person" size={size * 0.5} color={Colors.light.primary} />
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

function ReplyModal({ postId, visible, onClose }: { postId: string; visible: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const { data: replies, isLoading } = useQuery<(PostReply & { user?: User })[]>({
    queryKey: [`/api/posts/${postId}/replies`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: visible,
  });

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await apiRequest("POST", `/api/posts/${postId}/replies`, { content: text.trim() });
      setText("");
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${postId}/replies`] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Replies</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color="#888" />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        ) : (
          <FlatList
            data={replies || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.replyItem}>
                <Avatar uri={item.user?.avatarUrl} size={34} />
                <View style={styles.replyContent}>
                  <Text style={styles.replyAuthor}>{item.user?.fullName || "User"}</Text>
                  <Text style={styles.replyText}>{item.content}</Text>
                  <Text style={styles.replyTime}>
                    {getTimeAgo(item.createdAt ? new Date(item.createdAt) : new Date())}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyReplies}>
                <Text style={styles.emptyRepliesText}>No replies yet. Be the first!</Text>
              </View>
            }
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}

        <View style={styles.replyInput}>
          <Avatar uri={user?.avatarUrl} size={32} />
          <TextInput
            style={styles.replyTextInput}
            placeholder="Write a reply..."
            placeholderTextColor="#666"
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={submit}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.light.dark} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.light.dark} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PostCard({ post, currentUserId }: { post: Post & { user?: User; likedByMe?: boolean; replyCount?: number }; currentUserId?: string }) {
  const queryClient = useQueryClient();
  const [liked, setLiked] = useState<boolean>(!!post.likedByMe);
  const [likesCount, setLikesCount] = useState(post.likes ?? 0);
  const [showReplies, setShowReplies] = useState(false);
  const heartScale = useRef(new Animated.Value(1)).current;

  const timeAgo = getTimeAgo(post.createdAt ? new Date(post.createdAt) : new Date());

  const handleLike = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.35, useNativeDriver: true, speed: 30 }),
      Animated.spring(heartScale, { toValue: 1, useNativeDriver: true, speed: 30 }),
    ]).start();
    try {
      await apiRequest("POST", `/api/posts/${post.id}/like`, {});
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    } catch {
      setLiked(!newLiked);
      setLikesCount(prev => newLiked ? Math.max(0, prev - 1) : prev + 1);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `${post.user?.fullName || "Someone"} on Finders: "${post.content}"`,
      });
    } catch {}
  };

  const goToProfile = () => {
    if (post.user?.id && post.user.id !== currentUserId) {
      router.push(`/user/${post.user.id}`);
    }
  };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Pressable onPress={goToProfile} style={styles.avatarWrapper}>
          <Avatar uri={post.user?.avatarUrl} size={42} />
        </Pressable>
        <Pressable onPress={goToProfile} style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{post.user?.fullName || "User"}</Text>
          <Text style={styles.postRole}>{post.user?.role || "Member"}</Text>
        </Pressable>
        <Text style={styles.postTime}>{timeAgo}</Text>
      </View>

      <Text style={styles.postContent}>{post.content}</Text>

      {!!post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
          contentFit="cover"
        />
      )}

      <View style={styles.postActions}>
        <Pressable style={styles.actionBtn} onPress={handleLike}>
          <Animated.View style={{ transform: [{ scale: heartScale }] }}>
            <Ionicons
              name={liked ? "heart" : "heart-outline"}
              size={20}
              color={liked ? "#E74C3C" : "#888"}
            />
          </Animated.View>
          <Text style={[styles.actionText, liked && { color: "#E74C3C" }]}>{likesCount}</Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={() => setShowReplies(true)}>
          <Ionicons name="chatbubble-outline" size={18} color="#888" />
          <Text style={styles.actionText}>
            {(post.replyCount ?? 0) > 0 ? post.replyCount : "Reply"}
          </Text>
        </Pressable>

        <Pressable style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#888" />
          <Text style={styles.actionText}>Share</Text>
        </Pressable>
      </View>

      <ReplyModal
        postId={post.id}
        visible={showReplies}
        onClose={() => setShowReplies(false)}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();

  const { data: posts, isLoading, refetch } = useQuery<(Post & { user?: User; likedByMe?: boolean; replyCount?: number })[]>({
    queryKey: ["/api/posts"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={posts || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} currentUserId={user?.id} />}
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
              <Ionicons name="newspaper-outline" size={48} color="#555" />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the compose icon at the top to share something
              </Text>
            </View>
          ) : (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  listContent: { paddingBottom: 100, paddingTop: 8 },
  emptyListContent: { flex: 1 },
  postCard: {
    backgroundColor: "#1E1E1E",
    marginHorizontal: 12,
    marginVertical: 5,
    borderRadius: 14,
    padding: 14,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  avatarWrapper: { borderRadius: 21 },
  postAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF" },
  postRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.primary },
  postTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#888" },
  postContent: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#E0E0E0",
    lineHeight: 21,
    marginBottom: 10,
  },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#2A2A2A",
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
    paddingTop: 10,
    gap: 20,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 2,
  },
  actionText: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#FFFFFF" },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
  modalContainer: { flex: 1, backgroundColor: "#111111" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#2E2E2E",
    paddingTop: Platform.OS === "web" ? 67 + 16 : 16,
  },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#FFFFFF" },
  replyItem: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  replyContent: { flex: 1, gap: 3 },
  replyAuthor: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  replyText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#CCC", lineHeight: 20 },
  replyTime: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#888" },
  emptyReplies: { alignItems: "center", padding: 32 },
  emptyRepliesText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888" },
  replyInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
    backgroundColor: "#1A1A1A",
    paddingBottom: Platform.OS === "web" ? 34 : 16,
  },
  replyTextInput: {
    flex: 1,
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#FFFFFF",
    maxHeight: 100,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
