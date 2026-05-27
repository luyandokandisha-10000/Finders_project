import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { getQueryFn } from "@/lib/query-client";
import Colors from "@/constants/colors";
import type { User } from "@shared/schema";

const ROLE_COLORS: Record<string, string> = {
  Recruiter: "#8B5CF6",
  "Job Seeker": "#3B82F6",
  Intern: "#10B981",
  Hustler: "#F59E0B",
};

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

function UserCard({ user }: { user: User }) {
  const roleColor = ROLE_COLORS[user.role || ""] || "#888";
  return (
    <Pressable
      style={({ pressed }) => [styles.userCard, pressed && { opacity: 0.8 }]}
      onPress={() => router.push(`/user/${user.id}`)}
    >
      <Avatar uri={user.avatarUrl} size={50} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName || "User"}</Text>
        {user.role ? (
          <View style={[styles.roleBadge, { backgroundColor: roleColor + "20" }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{user.role}</Text>
          </View>
        ) : null}
        {user.bio ? <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text> : null}
        {user.location ? (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={12} color="#888" />
            <Text style={styles.locText}>{user.location}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#444" />
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.fullName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.skills?.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, roles, skills..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#888"
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard user={item} />}
          contentContainerStyle={[
            styles.list,
            filteredUsers.length === 0 && styles.emptyList,
          ]}
          scrollEnabled={filteredUsers.length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#444" />
              <Text style={styles.emptyTitle}>
                {search ? "No results found" : "No users yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search ? "Try a different search" : "Join the community!"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#1E1E1E", marginHorizontal: 14, marginTop: 10, marginBottom: 4,
    borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: "#333", gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: "#FFF" },
  list: { paddingBottom: 100, paddingTop: 6 },
  emptyList: { flex: 1 },
  userCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#1E1E1E", marginHorizontal: 14, marginVertical: 4,
    borderRadius: 14, padding: 12,
  },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFF" },
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleText: { fontFamily: "Inter_500Medium", fontSize: 11 },
  userBio: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#AAA" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  locText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#888" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#FFF" },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
});
