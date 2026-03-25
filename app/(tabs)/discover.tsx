import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { getQueryFn } from "@/lib/query-client";
import Colors from "@/constants/colors";
import type { User, Job } from "@shared/schema";

const ROLE_COLORS: Record<string, string> = {
  Recruiter: "#8B5CF6",
  "Job Seeker": "#3B82F6",
  Intern: "#10B981",
  Hustler: "#F59E0B",
};

type FilterType = "people" | "jobs" | "gigs";

const FILTERS: { key: FilterType; label: string; icon: any }[] = [
  { key: "people", label: "People", icon: "people-outline" },
  { key: "jobs", label: "Jobs", icon: "briefcase-outline" },
  { key: "gigs", label: "Short Work", icon: "flash-outline" },
];

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

function JobCard({ job, isShortWork }: { job: Job & { user?: User }; isShortWork?: boolean }) {
  return (
    <View style={styles.jobCard}>
      <View style={styles.jobHeader}>
        <View style={[styles.jobIcon, { backgroundColor: isShortWork ? "#2A2A1A" : "#1A1A2A" }]}>
          <Ionicons
            name={isShortWork ? "flash" : "briefcase"}
            size={20}
            color={isShortWork ? "#F59E0B" : Colors.light.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
        </View>
        {job.salary ? (
          <View style={styles.salaryBadge}>
            <Text style={styles.salaryText}>{job.salary}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.jobDesc} numberOfLines={2}>{job.description}</Text>
      <View style={styles.jobMeta}>
        {job.location ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color="#888" />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color="#888" />
          <Text style={styles.metaText}>{job.type || (isShortWork ? "Short-term" : "Full-time")}</Text>
        </View>
      </View>
      <View style={styles.jobFooter}>
        <Text style={styles.postedBy}>Posted by {job.user?.fullName || "Unknown"}</Text>
        {job.user?.id ? (
          <Pressable
            style={styles.viewProfile}
            onPress={() => router.push(`/user/${job.user!.id}`)}
          >
            <Text style={styles.viewProfileText}>View Profile</Text>
            <Ionicons name="arrow-forward" size={13} color={Colors.light.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function DiscoverScreen() {
  const [filter, setFilter] = useState<FilterType>("people");
  const [search, setSearch] = useState("");

  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: filter === "people",
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery<(Job & { user?: User })[]>({
    queryKey: ["/api/jobs?shortWork=false"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: filter === "jobs",
  });

  const { data: gigs, isLoading: loadingGigs } = useQuery<(Job & { user?: User })[]>({
    queryKey: ["/api/jobs?shortWork=true"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: filter === "gigs",
  });

  const filteredUsers = useMemo(() => {
    if (!users || filter !== "people") return [];
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u =>
      u.fullName?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q) ||
      u.skills?.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q)
    );
  }, [users, search, filter]);

  const filteredJobs = useMemo(() => {
    const list = filter === "jobs" ? jobs : filter === "gigs" ? gigs : [];
    if (!list || !search.trim()) return list || [];
    const q = search.toLowerCase();
    return list.filter(j =>
      j.title?.toLowerCase().includes(q) ||
      j.company?.toLowerCase().includes(q) ||
      j.location?.toLowerCase().includes(q)
    );
  }, [jobs, gigs, search, filter]);

  const isLoading = filter === "people" ? loadingUsers : filter === "jobs" ? loadingJobs : loadingGigs;
  const data: any[] = filter === "people" ? filteredUsers : filteredJobs;

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder={filter === "people" ? "Search people, roles, skills..." : "Search jobs, companies..."}
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

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <Pressable
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => { setFilter(f.key); setSearch(""); }}
          >
            <Ionicons
              name={f.icon}
              size={15}
              color={filter === f.key ? Colors.light.primary : "#888"}
            />
            <Text style={[styles.filterLabel, filter === f.key && styles.filterLabelActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}

        {(filter === "jobs" || filter === "gigs") && (
          <Pressable
            style={styles.postJobBtn}
            onPress={() => router.push(`/create-job?shortWork=${filter === "gigs"}`)}
          >
            <Ionicons name="add" size={16} color={Colors.light.primary} />
            <Text style={styles.postJobText}>Post</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            filter === "people" ? (
              <UserCard user={item} />
            ) : (
              <JobCard job={item} isShortWork={filter === "gigs"} />
            )
          }
          contentContainerStyle={[
            styles.list,
            data.length === 0 && styles.emptyList,
          ]}
          scrollEnabled={data.length > 0}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons
                name={filter === "people" ? "people-outline" : filter === "jobs" ? "briefcase-outline" : "flash-outline"}
                size={48}
                color="#444"
              />
              <Text style={styles.emptyTitle}>
                {search ? "No results found" : filter === "people" ? "No users yet" : filter === "jobs" ? "No jobs posted" : "No gigs posted"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {search ? "Try a different search" : filter !== "people" ? "Be the first to post!" : "Join the community!"}
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
    backgroundColor: "#1E1E1E", marginHorizontal: 14, marginTop: 10,
    borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: "#333", gap: 8,
  },
  searchInput: { flex: 1, paddingVertical: 12, fontFamily: "Inter_400Regular", fontSize: 14, color: "#FFF" },
  filterRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center" },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: "#333",
  },
  filterChipActive: { borderColor: Colors.light.primary, backgroundColor: "#2A2A1A" },
  filterLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#888" },
  filterLabelActive: { color: Colors.light.primary },
  postJobBtn: {
    flexDirection: "row", alignItems: "center", gap: 3,
    marginLeft: "auto" as any, paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.light.primary + "80",
    backgroundColor: "#2A2A1A",
  },
  postJobText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.primary },
  list: { paddingBottom: 100 },
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
  jobCard: {
    backgroundColor: "#1E1E1E", marginHorizontal: 14, marginVertical: 4,
    borderRadius: 14, padding: 14, gap: 10,
  },
  jobHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  jobIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  jobTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFF" },
  jobCompany: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#AAA" },
  salaryBadge: { backgroundColor: "#1A2A1A", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  salaryText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#10B981" },
  jobDesc: { fontFamily: "Inter_400Regular", fontSize: 13, color: "#CCC", lineHeight: 19 },
  jobMeta: { flexDirection: "row", gap: 14 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#888" },
  jobFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#2E2E2E", paddingTop: 8 },
  postedBy: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#888" },
  viewProfile: { flexDirection: "row", alignItems: "center", gap: 4 },
  viewProfileText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.light.primary },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 12 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#FFF" },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
});
