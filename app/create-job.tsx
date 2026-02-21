import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { apiRequest } from "@/lib/query-client";
import { useQueryClient } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Freelance", "Remote"];

export default function CreateJobScreen() {
  const { shortWork } = useLocalSearchParams<{ shortWork: string }>();
  const isShortWork = shortWork === "true";
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState(isShortWork ? "Freelance" : "Full-time");
  const [salary, setSalary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !company.trim() || !description.trim()) {
      Alert.alert("Missing fields", "Please fill in at least the title, company, and description.");
      return;
    }

    setLoading(true);
    try {
      await apiRequest("POST", "/api/jobs", {
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        description: description.trim(),
        type,
        salary: salary.trim(),
        isShortWork,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/jobs?shortWork=${shortWork}`] });
      router.back();
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to post job. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Job Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Frontend Developer"
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Company</Text>
          <TextInput
            style={styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="Company name"
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="City, Country or Remote"
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Job Type</Text>
          <View style={styles.typeRow}>
            {JOB_TYPES.map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, type === t && styles.typeChipActive]}
                onPress={() => {
                  setType(t);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                  {t}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Salary Range (optional)</Text>
          <TextInput
            style={styles.input}
            value={salary}
            onChangeText={setSalary}
            placeholder="e.g. $50k - $80k"
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the role, requirements, and what you're looking for..."
            multiline
            textAlignVertical="top"
            placeholderTextColor={Colors.light.textSecondary}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && styles.submitBtnPressed,
            (!title.trim() || !company.trim() || !description.trim() || loading) && styles.submitBtnDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!title.trim() || !company.trim() || !description.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>
                {isShortWork ? "Post Gig" : "Post Job"}
              </Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
  },
  multiline: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  typeChipActive: {
    backgroundColor: "#E8F4FD",
    borderColor: Colors.light.primary,
  },
  typeChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.light.primary,
  },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  submitBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    color: "#fff",
  },
});
