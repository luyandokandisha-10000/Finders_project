import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import type { Job, User } from "@shared/schema";

function JobCard({ job, currentUserId }: { job: Job & { user?: User }; currentUserId?: string }) {
  const [messaging, setMessaging] = useState(false);
  const isOwn = job.userId === currentUserId;

  const openDetail = () => router.push(`/job/${job.id}`);

  const handleMessage = async (e: any) => {
    e?.stopPropagation?.();
    if (!job.userId) return;
    setMessaging(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const conv = await apiRequest("POST", "/api/conversations", { targetUserId: job.userId });
      router.push(`/conversation/${conv.id}`);
    } catch {
      Alert.alert("Error", "Could not start conversation.");
    } finally {
      setMessaging(false);
    }
  };

  return (
    <Pressable onPress={openDetail} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="briefcase" size={20} color={Colors.light.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{job.title}</Text>
          <Text style={styles.cardCompany}>{job.company}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={3}>{job.description}</Text>
      <View style={styles.cardMeta}>
        {job.location ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={styles.metaText}>{job.type || "Full-time"}</Text>
        </View>
        {job.salary ? (
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color="#888" />
            <Text style={styles.metaText}>{job.salary}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.postedBy}>
          Posted by {job.user?.fullName || "Unknown"}
        </Text>
        <View style={styles.cardActions}>
          {!isOwn && job.userId && (
            <Pressable
              style={styles.messageBtn}
              onPress={handleMessage}
              disabled={messaging}
              hitSlop={6}
            >
              {messaging ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <>
                  <Ionicons name="chatbubble-ellipses-outline" size={14} color={Colors.light.primary} />
                  <Text style={styles.messageBtnText}>Message</Text>
                </>
              )}
            </Pressable>
          )}
          <Pressable style={styles.applyBtn} onPress={openDetail} hitSlop={6}>
            <Text style={styles.applyBtnText}>View</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.light.primary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

function LocationBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.locationBar}>
      <Ionicons name="location-outline" size={16} color={value ? Colors.light.primary : "#888"} />
      <TextInput
        style={styles.locationInput}
        placeholder="Filter by location (e.g. Nairobi, Remote...)"
        value={value}
        onChangeText={onChange}
        placeholderTextColor="#555"
      />
      {value ? (
        <Pressable onPress={() => onChange("")} hitSlop={8}>
          <Ionicons name="close-circle" size={16} color="#888" />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function JobsScreen() {
  const { user } = useAuth();
  const [locationFilter, setLocationFilter] = useState("");

  const { data: jobs, isLoading, refetch } = useQuery<(Job & { user?: User })[]>({
    queryKey: ["/api/jobs?shortWork=false"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const filtered = useMemo(() => {
    if (!jobs) return [];
    const lq = locationFilter.trim().toLowerCase();
    if (!lq) return jobs;
    return jobs.filter(j => (j.location || "").toLowerCase().includes(lq));
  }, [jobs, locationFilter]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} currentUserId={user?.id} />}
        contentContainerStyle={[
          styles.listContent,
          filtered.length === 0 && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.light.primary} />
        }
        scrollEnabled={filtered.length > 0}
        ListHeaderComponent={
          <View>
            <Pressable
              style={styles.addBtn}
              onPress={() => router.push("/create-job?shortWork=false")}
            >
              <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
              <Text style={styles.addBtnText}>Post a Job Opportunity</Text>
            </Pressable>
            <LocationBar value={locationFilter} onChange={setLocationFilter} />
          </View>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color="#555" />
              <Text style={styles.emptyTitle}>
                {locationFilter ? "No jobs in that location" : "No job opportunities yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {locationFilter ? "Try a different location or clear the filter" : "Post full-time, part-time, or remote job listings"}
              </Text>
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
    backgroundColor: "#111111",
  },
  listContent: {
    paddingBottom: 100,
    paddingTop: 8,
  },
  emptyListContent: {
    flex: 1,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1E1E1E",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary + "40",
    borderStyle: "dashed",
  },
  addBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E1E1E",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#333",
  },
  locationInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#FFF",
  },
  card: {
    backgroundColor: "#1E1E1E",
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2A2A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#FFFFFF",
  },
  cardCompany: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: "#AAA",
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#CCC",
    lineHeight: 20,
  },
  cardMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 10,
  },
  postedBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary + "60",
  },
  messageBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: Colors.light.primary,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  applyBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    color: Colors.light.primary,
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
    color: "#FFFFFF",
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
});
