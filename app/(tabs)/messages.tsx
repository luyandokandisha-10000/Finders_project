import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import { getQueryFn } from "@/lib/query-client";
import type { Conversation, User, Message } from "@shared/schema";

type ConvWithExtra = Conversation & { otherUser?: User; lastMessage?: Message };

function Avatar({ uri, size = 48 }: { uri?: string | null; size?: number }) {
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
      <Ionicons name="person" size={size * 0.45} color={Colors.light.primary} />
    </View>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

function ConvCard({ conv }: { conv: ConvWithExtra }) {
  const lastTime = conv.lastMessage?.createdAt
    ? getTimeAgo(new Date(conv.lastMessage.createdAt))
    : "";

  return (
    <Pressable
      style={({ pressed }) => [styles.convCard, pressed && { opacity: 0.8 }]}
      onPress={() => router.push(`/conversation/${conv.id}`)}
    >
      <Avatar uri={conv.otherUser?.avatarUrl} size={52} />
      <View style={styles.convInfo}>
        <View style={styles.convRow}>
          <Text style={styles.convName} numberOfLines={1}>
            {conv.otherUser?.fullName || "User"}
          </Text>
          {lastTime ? <Text style={styles.convTime}>{lastTime}</Text> : null}
        </View>
        {conv.otherUser?.role ? (
          <Text style={styles.convRole}>{conv.otherUser.role}</Text>
        ) : null}
        {conv.lastMessage ? (
          <Text style={styles.convPreview} numberOfLines={1}>
            {conv.lastMessage.content}
          </Text>
        ) : (
          <Text style={styles.convNoMessages}>No messages yet</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#444" />
    </Pressable>
  );
}

export default function MessagesScreen() {
  const { user } = useAuth();

  const { data: convs, isLoading, refetch } = useQuery<ConvWithExtra[]>({
    queryKey: ["/api/conversations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={convs || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ConvCard conv={item} />}
        contentContainerStyle={[
          styles.list,
          (!convs || convs.length === 0) && styles.emptyList,
        ]}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={52} color="#444" />
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>
              Visit someone's profile to start a conversation
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111111" },
  list: { paddingTop: 8, paddingBottom: 100 },
  emptyList: { flex: 1 },
  convCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E1E1E",
  },
  convInfo: { flex: 1, gap: 3 },
  convRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  convName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFFFFF", flex: 1 },
  convTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#888", marginLeft: 8 },
  convRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.primary },
  convPreview: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888" },
  convNoMessages: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#555", fontStyle: "italic" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#FFFFFF" },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
});
