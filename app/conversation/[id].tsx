import React, { useState, useRef, useCallback, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { getQueryFn, apiRequest } from "@/lib/query-client";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import type { Message, User, Conversation } from "@shared/schema";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type MessageWithSender = Message & { sender?: User };
type ConvWithOther = Conversation & { otherUser?: User };

const VIDEO_CALL_PREFIX = "[video-call]";

function isVideoCallMessage(content: string): boolean {
  return content.startsWith(VIDEO_CALL_PREFIX);
}

function Avatar({ uri, size = 32 }: { uri?: string | null; size?: number }) {
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

function getTimeStr(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { data: conv } = useQuery<ConvWithOther>({
    queryKey: [`/api/conversations/${id}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!id,
  });

  const { data: messages, isLoading } = useQuery<MessageWithSender[]>({
    queryKey: [`/api/conversations/${id}/messages`],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!id,
    refetchInterval: 5000,
  });

  const reversedMessages = messages ? [...messages].reverse() : [];

  const sendMessage = useCallback(async (content: string) => {
    await apiRequest("POST", `/api/conversations/${id}/messages`, { content });
    queryClient.invalidateQueries({ queryKey: [`/api/conversations/${id}/messages`] });
    queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
  }, [id, queryClient]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    setText("");
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sendMessage(content);
    } catch {
      setText(content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSending(false);
    }
  }, [text, sending, sendMessage]);

  const handleStartVideoCall = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await sendMessage(`${VIDEO_CALL_PREFIX} ${currentUser?.fullName || "Someone"} started a video call. Tap to join.`);
      router.push(`/video-call/${id}`);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Could not start the call. Please try again.");
    }
  }, [id, currentUser, sendMessage]);

  const otherUser = conv?.otherUser;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: otherUser?.fullName || "Chat",
      headerRight: () => (
        <Pressable
          onPress={handleStartVideoCall}
          style={({ pressed }) => [styles.headerCallBtn, pressed && { opacity: 0.6 }]}
          hitSlop={10}
          accessibilityLabel="Start video call"
          testID="start-video-call"
        >
          <Ionicons name="videocam" size={22} color={Colors.light.primary} />
        </Pressable>
      ),
    });
  }, [navigation, handleStartVideoCall, otherUser?.fullName]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      {isLoading && !messages ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : reversedMessages.length === 0 ? (
        <View style={styles.emptyChat}>
          {otherUser && <Avatar uri={otherUser.avatarUrl} size={60} />}
          <Text style={styles.emptyChatName}>{otherUser?.fullName || "User"}</Text>
          <Text style={styles.emptyChatHint}>Say hello!</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={reversedMessages}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUser?.id;
            const time = item.createdAt ? getTimeStr(new Date(item.createdAt)) : "";
            const isCall = isVideoCallMessage(item.content);
            return (
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && <Avatar uri={item.sender?.avatarUrl} size={30} />}
                {isCall ? (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push(`/video-call/${id}`);
                    }}
                    style={[styles.callBubble, isMe && styles.callBubbleMe]}
                    testID="join-video-call"
                  >
                    <View style={styles.callIconCircle}>
                      <Ionicons name="videocam" size={20} color={Colors.light.dark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      {!isMe && item.sender && (
                        <Text style={styles.bubbleSender}>{item.sender?.fullName || "User"}</Text>
                      )}
                      <Text style={styles.callTitle}>Video Call</Text>
                      <Text style={styles.callCta}>Tap to join</Text>
                      <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{time}</Text>
                    </View>
                  </Pressable>
                ) : (
                  <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
                    {!isMe && otherUser && (
                      <Text style={styles.bubbleSender}>{item.sender?.fullName || "User"}</Text>
                    )}
                    <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                      {item.content}
                    </Text>
                    <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
                      {time}
                    </Text>
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 12 }}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        />
      )}

      <View style={[styles.inputBar, { paddingBottom: bottomPad > 0 ? bottomPad : 12 }]}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#666"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.light.dark} />
          ) : (
            <Ionicons name="send" size={18} color={Colors.light.dark} />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111111" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  msgRow: { flexDirection: "row", alignItems: "flex-end", marginVertical: 3, gap: 6 },
  msgRowMe: { flexDirection: "row-reverse" },
  bubble: {
    maxWidth: "75%", borderRadius: 18, padding: 10,
    paddingHorizontal: 14,
  },
  bubbleMe: {
    backgroundColor: Colors.light.primary, borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#1E1E1E", borderBottomLeftRadius: 4,
  },
  bubbleSender: { fontFamily: "Inter_500Medium", fontSize: 11, color: Colors.light.primary, marginBottom: 2 },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#CCC", lineHeight: 20 },
  bubbleTextMe: { color: Colors.light.dark },
  bubbleTime: { fontFamily: "Inter_400Regular", fontSize: 10, color: "#888", marginTop: 4, alignSelf: "flex-end" },
  callBubble: {
    flexDirection: "row", alignItems: "center", gap: 12,
    maxWidth: "78%", borderRadius: 18, padding: 12, paddingHorizontal: 14,
    backgroundColor: "#1E1E1E", borderWidth: 1, borderColor: Colors.light.primary + "55",
    borderBottomLeftRadius: 4,
  },
  callBubbleMe: {
    borderBottomLeftRadius: 18, borderBottomRightRadius: 4,
    backgroundColor: "#2A2410", borderColor: Colors.light.primary,
  },
  callIconCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
  },
  callTitle: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#FFFFFF" },
  callCta: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.light.primary, marginTop: 2 },
  headerCallBtn: { paddingHorizontal: 8, paddingVertical: 4, marginRight: 4 },
  bubbleTimeMe: { color: Colors.light.dark + "AA" },
  emptyChat: {
    flex: 1, alignItems: "center", justifyContent: "center", padding: 60, gap: 12,
  },
  emptyChatName: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: "#FFF" },
  emptyChatHint: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888" },
  inputBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#1A1A1A", paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1, borderTopColor: "#2E2E2E",
  },
  input: {
    flex: 1, backgroundColor: "#2A2A2A", borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 10,
    fontFamily: "Inter_400Regular", fontSize: 14, color: "#FFF",
    maxHeight: 100,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center", justifyContent: "center",
  },
});
