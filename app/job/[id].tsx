import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { apiRequest, getQueryFn } from "@/lib/query-client";
import { useAuth } from "@/lib/auth-context";
import type { Job, User } from "@shared/schema";

function Avatar({ uri, size = 44 }: { uri?: string | null; size?: number }) {
  if (uri && uri.length > 5) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#2A2A2A" }}
        contentFit="cover"
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: Colors.light.primary,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name="person" size={size * 0.55} color={Colors.light.dark} />
    </View>
  );
}

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const [messaging, setMessaging] = useState(false);

  const { data: job, isLoading } = useQuery<Job & { user?: User }>({
    queryKey: [`/api/jobs/${id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!id,
  });

  const isOwn = job?.userId === currentUser?.id;

  const handleMessage = async () => {
    if (!job?.userId) return;
    if (!currentUser) {
      router.push("/auth");
      return;
    }
    setMessaging(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const conv = await apiRequest("POST", "/api/conversations", { targetUserId: job.userId });
      router.push(`/conversation/${conv.id}`);
    } catch {
      Alert.alert("Error", "Could not start conversation. Please try again.");
    } finally {
      setMessaging(false);
    }
  };

  const goToProfile = () => {
    if (job?.userId) router.push(`/user/${job.userId}`);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={48} color="#555" />
        <Text style={styles.notFoundText}>Job not found</Text>
      </View>
    );
  }

  const isShortWork = (job as any).shortWork === true;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <View style={[styles.iconCircle, isShortWork && styles.iconCircleShort]}>
            <Ionicons
              name={isShortWork ? "flash" : "briefcase"}
              size={26}
              color={isShortWork ? "#F59E0B" : Colors.light.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.company}>{job.company}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {job.location ? (
            <View style={styles.metaChip}>
              <Ionicons name="location-outline" size={14} color="#CCC" />
              <Text style={styles.metaChipText}>{job.location}</Text>
            </View>
          ) : null}
          <View style={styles.metaChip}>
            <Ionicons name="time-outline" size={14} color="#CCC" />
            <Text style={styles.metaChipText}>{job.type || (isShortWork ? "Short-term" : "Full-time")}</Text>
          </View>
          {job.salary ? (
            <View style={[styles.metaChip, styles.salaryChip]}>
              <Ionicons name="cash-outline" size={14} color="#10B981" />
              <Text style={[styles.metaChipText, { color: "#10B981" }]}>{job.salary}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {job.user && (
          <Pressable style={styles.posterCard} onPress={goToProfile}>
            <Avatar uri={job.user.avatarUrl} size={50} />
            <View style={{ flex: 1 }}>
              <Text style={styles.posterLabel}>Posted by</Text>
              <Text style={styles.posterName}>{job.user.fullName || "User"}</Text>
              {job.user.role ? (
                <Text style={styles.posterRole}>{job.user.role}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </Pressable>
        )}
      </ScrollView>

      {!isOwn && job.userId && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.messageBtn, messaging && { opacity: 0.6 }]}
            onPress={handleMessage}
            disabled={messaging}
          >
            {messaging ? (
              <ActivityIndicator size="small" color={Colors.light.dark} />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses" size={18} color={Colors.light.dark} />
                <Text style={styles.messageBtnText}>Message Poster</Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#111111", gap: 12 },
  notFoundText: { fontFamily: "Inter_500Medium", fontSize: 16, color: "#888" },
  scrollContent: { padding: 18, paddingBottom: 120, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "#2A2A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircleShort: { backgroundColor: "#2A1F0A" },
  title: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFFFFF", lineHeight: 28 },
  company: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#AAA", marginTop: 2 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#1E1E1E",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  salaryChip: { backgroundColor: "#0F2A1A" },
  metaChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#CCC" },
  section: { gap: 8 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.light.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  description: { fontFamily: "Inter_400Regular", fontSize: 15, color: "#DDD", lineHeight: 23 },
  posterCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1E1E1E",
    padding: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  posterLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: "#888", textTransform: "uppercase" },
  posterName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#FFF", marginTop: 2 },
  posterRole: { fontFamily: "Inter_400Regular", fontSize: 12, color: "#AAA", marginTop: 1 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1A1A1A",
    borderTopWidth: 1,
    borderTopColor: "#2E2E2E",
    padding: 14,
    paddingBottom: Platform.OS === "web" ? 34 + 14 : 24,
  },
  messageBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  messageBtnText: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: Colors.light.dark,
  },
});
