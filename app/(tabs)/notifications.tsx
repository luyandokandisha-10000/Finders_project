import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import { getQueryFn, apiRequest } from "@/lib/query-client";
import type { Notification, User } from "@shared/schema";

type NotifWithActor = Notification & { actor?: User };

function Avatar({ uri, size = 42 }: { uri?: string | null; size?: number }) {
  if (uri && uri.length > 5) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
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

function getNotifIcon(type: string): { name: any; color: string } {
  switch (type) {
    case "like": return { name: "heart", color: "#E74C3C" };
    case "reply": return { name: "chatbubble", color: "#3B82F6" };
    case "message": return { name: "chatbubbles", color: Colors.light.primary };
    case "hire": return { name: "briefcase", color: "#10B981" };
    default: return { name: "notifications", color: "#888" };
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotifCard({ notif }: { notif: NotifWithActor }) {
  const icon = getNotifIcon(notif.type);

  const handlePress = () => {
    if (notif.type === "message") {
      router.push("/(tabs)/messages");
    } else if (notif.postId) {
      router.push("/");
    } else if (notif.actorId) {
      router.push(`/user/${notif.actorId}`);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.notifCard, !notif.read && styles.notifUnread, pressed && { opacity: 0.8 }]}
      onPress={handlePress}
    >
      <View style={styles.notifLeft}>
        <Avatar uri={notif.actor?.avatarUrl} size={44} />
        <View style={[styles.notifIconBadge, { backgroundColor: icon.color + "20" }]}>
          <Ionicons name={icon.name} size={14} color={icon.color} />
        </View>
      </View>
      <View style={styles.notifBody}>
        <Text style={styles.notifMessage}>{notif.message || `New ${notif.type} notification`}</Text>
        <Text style={styles.notifTime}>
          {getTimeAgo(notif.createdAt ? new Date(notif.createdAt) : new Date())}
        </Text>
      </View>
      {!notif.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifs, isLoading, refetch } = useQuery<NotifWithActor[]>({
    queryKey: ["/api/notifications"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (notifs && notifs.some(n => !n.read)) {
      const timer = setTimeout(async () => {
        try {
          await apiRequest("POST", "/api/notifications/read", {});
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
        } catch {}
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [notifs]);

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
        data={notifs || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NotifCard notif={item} />}
        contentContainerStyle={[
          styles.list,
          (!notifs || notifs.length === 0) && styles.emptyList,
        ]}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={52} color="#444" />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>
              When people like or reply to your posts, you'll see it here
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
  list: { paddingTop: 4, paddingBottom: 100 },
  emptyList: { flex: 1 },
  notifCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1A1A1A",
  },
  notifUnread: { backgroundColor: "#1A1A26" },
  notifLeft: { position: "relative" },
  notifIconBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#111111",
  },
  notifBody: { flex: 1, gap: 3 },
  notifMessage: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#E0E0E0", lineHeight: 20 },
  notifTime: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#888" },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.light.primary },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#FFFFFF" },
  emptySub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
});
