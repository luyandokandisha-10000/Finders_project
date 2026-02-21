import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getQueryFn } from "@/lib/query-client";
import Colors from "@/constants/colors";
import type { Job, User } from "@shared/schema";

function ShortWorkCard({ job }: { job: Job & { user?: User } }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Ionicons name="flash" size={20} color="#F59E0B" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{job.title}</Text>
          <Text style={styles.cardCompany}>{job.company}</Text>
        </View>
        {job.salary ? (
          <View style={styles.salaryBadge}>
            <Text style={styles.salaryText}>{job.salary}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardDesc} numberOfLines={3}>{job.description}</Text>
      <View style={styles.cardFooter}>
        {job.location ? (
          <View style={styles.tagRow}>
            <Ionicons name="location-outline" size={14} color="#888" />
            <Text style={styles.tagText}>{job.location}</Text>
          </View>
        ) : null}
        <View style={styles.tagRow}>
          <Ionicons name="time-outline" size={14} color="#888" />
          <Text style={styles.tagText}>{job.type || "Short-term"}</Text>
        </View>
      </View>
      <View style={styles.cardPostedBy}>
        <Text style={styles.postedBy}>
          Posted by {job.user?.fullName || "Unknown"}
        </Text>
      </View>
    </View>
  );
}

export default function ShortWorkScreen() {
  const { data: jobs, isLoading, refetch } = useQuery<(Job & { user?: User })[]>({
    queryKey: ["/api/jobs?shortWork=true"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs || []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ShortWorkCard job={item} />}
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
            onPress={() => router.push("/create-job?shortWork=true")}
          >
            <Ionicons name="add-circle" size={20} color={Colors.light.primary} />
            <Text style={styles.addBtnText}>Post a Short Work Gig</Text>
          </Pressable>
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Ionicons name="flash-outline" size={48} color="#555" />
              <Text style={styles.emptyTitle}>No short work gigs yet</Text>
              <Text style={styles.emptySubtitle}>Post freelance, contract, or temporary work opportunities</Text>
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
  salaryBadge: {
    backgroundColor: "#1A2A1A",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  salaryText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    color: "#10B981",
  },
  cardDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: "#CCC",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 16,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888",
  },
  cardPostedBy: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 10,
  },
  postedBy: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "#888",
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
