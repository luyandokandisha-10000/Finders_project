import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { getQueryFn } from "@/lib/query-client";
import Colors from "@/constants/colors";
import type { User } from "@shared/schema";

const ROLE_COLORS: Record<string, string> = {
  Recruiter: "#8B5CF6",
  "Job Seeker": "#2563EB",
  Intern: "#059669",
  Hustler: "#EA580C",
};

function UserCard({ user }: { user: User }) {
  const roleColor = ROLE_COLORS[user.role || ""] || Colors.light.textSecondary;

  return (
    <Pressable style={styles.userCard}>
      <View style={styles.userAvatar}>
        <Ionicons name="person" size={24} color={Colors.light.primary} />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.fullName || "User"}</Text>
        {user.role ? (
          <View style={[styles.roleBadge, { backgroundColor: roleColor + "18" }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{user.role}</Text>
          </View>
        ) : null}
        {user.bio ? (
          <Text style={styles.userBio} numberOfLines={2}>{user.bio}</Text>
        ) : null}
        {user.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.locationText}>{user.location}</Text>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.light.textSecondary} />
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const [search, setSearch] = useState("");

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.fullName?.toLowerCase().includes(q)) ||
        (u.role?.toLowerCase().includes(q)) ||
        (u.skills?.toLowerCase().includes(q)) ||
        (u.location?.toLowerCase().includes(q))
    );
  }, [users, search]);

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color={Colors.light.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, roles, skills..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={Colors.light.textSecondary}
        />
        {search ? (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.light.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <UserCard user={item} />}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.emptyListContent,
          ]}
          scrollEnabled={!!filtered.length}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTitle}>
                {search ? "No results found" : "No users yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search ? "Try a different search term" : "Be the first to join the community"}
              </Text>
            </View>
          }
        />
      )}
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
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: Colors.light.text,
  },
  roleBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleText: {
    fontFamily: "Inter_500Medium",
    fontSize: 11,
  },
  userBio: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
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
});
