import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";

const ITEMS = [
  {
    key: "profile",
    label: "My Profile",
    desc: "View and edit your details",
    icon: "person" as const,
    color: "#8B5CF6",
    bg: "#2A1F3D",
    route: "/(tabs)/profile",
  },
  {
    key: "messages",
    label: "Messages",
    desc: "Chat with recruiters & candidates",
    icon: "chatbubbles" as const,
    color: "#3B82F6",
    bg: "#1A2640",
    route: "/(tabs)/messages",
  },
  {
    key: "notifications",
    label: "Alerts",
    desc: "Likes, replies, hires & more",
    icon: "notifications" as const,
    color: "#F59E0B",
    bg: "#2A2A1A",
    route: "/(tabs)/notifications",
  },
];

export default function MenuScreen() {
  const { data: notifs } = useQuery<any[]>({ queryKey: ["/api/notifications"] });
  const unread = (notifs || []).filter((n: any) => !n.read).length;

  const go = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
    setTimeout(() => router.push(route as any), 50);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quick Access</Text>
      <Text style={styles.subtitle}>Jump to your personal sections</Text>

      <View style={styles.list}>
        {ITEMS.map((item) => {
          const showBadge = item.key === "notifications" && unread > 0;
          return (
            <Pressable
              key={item.key}
              style={({ pressed }) => [
                styles.row,
                { borderColor: item.color + "55" },
                pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
              onPress={() => go(item.route)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bg }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>{item.label}</Text>
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.desc}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  content: { padding: 20, gap: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF" },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#888", marginBottom: 12 },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1E1E1E",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFFFFF" },
  desc: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#999", marginTop: 2 },
  badge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 10, minWidth: 20, alignItems: "center",
  },
  badgeText: { fontFamily: "Inter_700Bold", fontSize: 11, color: Colors.light.dark },
});
