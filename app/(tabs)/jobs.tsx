import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getQueryFn } from "@/lib/query-client";
import Colors from "@/constants/colors";
import type { Job, User } from "@shared/schema";

function JobCard({ job }: { job: Job & { user?: User } }) {
  return (
    <View style={styles.card}>
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
            <Ionicons name="location-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{job.location}</Text>
          </View>
        ) : null}
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.metaText}>{job.type || "Full-time"}</Text>
        </View>
        {job.salary ? (
          <View style={styles.metaItem}>
            <Ionicons name="cash-outline" size={14} color={Colors.light.textSecondary} />
            <Text style={styles.metaText}>{job.salary}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.postedBy}>
          Posted by {job.user?.fullName || "Unknown"}
        </Text>
        <Pressable style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>View</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.light.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function JobsScreen() {
  const { data: jobs, isLoading, refetch } = useQuery<(Job & { user?: User })[]>({
    queryKey: ["/api/jobs?shortWork=false"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <JobCard job={item} />}
        contentContainerStyle={[
          styles.listContent,
          (!jobs || jobs.length === 0) && styles.emptyListContent,
        ]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={Colors.light.primary} />
        }
        scrollEnabled={!!(jobs && jobs.length > 0)}
        ListHeaderComponent={
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push("/create-job?shortWork=false")}
          >
            <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
            <Text style={styles.addBtnText}>Post a Job Opportunity</Text>
          </Pressable>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase-outline" size={48} color={Colors.light.textSecondary} />
              <Text style={styles.emptyTitle}>No job opportunities yet</Text>
              <Text style={styles.emptySubtitle}>Post full-time, part-time, or remote job listings</Text>
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
    backgroundColor: Colors.light.surface,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.primary + "30",
    borderStyle: "dashed",
  },
  addBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: Colors.light.primary,
  },
  card: {
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
    backgroundColor: "#E8F4FD",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: Colors.light.text,
  },
  cardCompany: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.text,
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
    color: Colors.light.textSecondary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 10,
  },
  postedBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: Colors.light.textSecondary,
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
    color: Colors.light.text,
  },
  emptySubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
