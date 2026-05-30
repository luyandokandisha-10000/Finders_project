import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/lib/auth-context";
import Colors from "@/constants/colors";
import * as Haptics from "expo-haptics";

export default function VideoCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const roomName = `finders-call-${id}`;
  const displayName = encodeURIComponent(user?.fullName || "Finders User");
  const callUrl = `https://meet.jit.si/${roomName}#userInfo.displayName="${displayName}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false`;

  const handleEnd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webFallback, { paddingTop: insets.top + 20 }]}>
        <Ionicons name="videocam" size={48} color={Colors.light.primary} />
        <Text style={styles.webTitle}>Video Call</Text>
        <Text style={styles.webSub}>
          Open this on your phone to join the call.
        </Text>
        <Text style={styles.webRoom}>Room: {roomName}</Text>
        <Pressable style={styles.webBackBtn} onPress={() => router.back()}>
          <Text style={styles.webBackText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: callUrl }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        onLoadStart={() => setLoading(true)}
        onLoad={() => setLoading(false)}
        onError={() => { setLoading(false); setError(true); }}
        javaScriptEnabled
        domStorageEnabled
        cameraEnabled
        microphoneEnabled
        allowsFullscreenVideo
      />

      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Connecting to call...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorOverlay}>
          <Ionicons name="videocam-off" size={48} color="#888" />
          <Text style={styles.errorTitle}>Couldn't connect</Text>
          <Text style={styles.errorSub}>Check your internet connection and try again.</Text>
          <Pressable style={styles.retryBtn} onPress={() => { setError(false); setLoading(true); }}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.endBtnWrapper, { top: insets.top + 12 }]}>
        <Pressable
          style={({ pressed }) => [styles.endBtn, pressed && { opacity: 0.85 }]}
          onPress={handleEnd}
          accessibilityLabel="End call"
          testID="end-video-call"
        >
          <Ionicons name="call" size={20} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  webview: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#AAA" },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 40,
  },
  errorTitle: { fontFamily: "Inter_700Bold", fontSize: 18, color: "#FFF", marginTop: 8 },
  errorSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
  retryBtn: {
    marginTop: 8, paddingHorizontal: 28, paddingVertical: 12,
    backgroundColor: Colors.light.primary, borderRadius: 12,
  },
  retryText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#111" },
  endBtnWrapper: {
    position: "absolute",
    right: 16,
  },
  endBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#E53935",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 6,
  },
  webFallback: {
    flex: 1, backgroundColor: "#111", alignItems: "center",
    justifyContent: "center", padding: 40, gap: 12,
  },
  webTitle: { fontFamily: "Inter_700Bold", fontSize: 22, color: "#FFF" },
  webSub: { fontFamily: "Inter_400Regular", fontSize: 14, color: "#888", textAlign: "center" },
  webRoom: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.light.primary },
  webBackBtn: {
    marginTop: 16, paddingHorizontal: 28, paddingVertical: 12,
    backgroundColor: Colors.light.primary, borderRadius: 12,
  },
  webBackText: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#111" },
});
