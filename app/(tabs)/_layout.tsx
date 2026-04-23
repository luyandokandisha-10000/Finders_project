import { Tabs, router } from "expo-router";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import Colors from "@/constants/colors";

function HeaderRight({ children }: { children?: React.ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginRight: 14 }}>
      {children}
      <Pressable onPress={() => router.push("/menu" as any)} hitSlop={8}>
        <Ionicons name="menu" size={26} color={Colors.light.primary} />
      </Pressable>
    </View>
  );
}

function PostJobBtn({ shortWork }: { shortWork: boolean }) {
  return (
    <Pressable
      onPress={() => router.push(`/create-job?shortWork=${shortWork}` as any)}
      hitSlop={8}
    >
      <Ionicons name="add-circle" size={28} color={Colors.light.primary} />
    </Pressable>
  );
}

function HomeComposeBtn() {
  return (
    <Pressable onPress={() => router.push("/create-post")} hitSlop={8}>
      <Ionicons name="create-outline" size={26} color={Colors.light.primary} />
    </Pressable>
  );
}

export default function TabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: "#666666",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#1A1A1A",
          ...(isWeb ? { height: 67 + 44 } : {}),
        },
        headerTintColor: Colors.light.primary,
        headerTitleStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 18,
          color: "#FFFFFF",
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
          marginBottom: 2,
        },
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : "#1A1A1A",
          borderTopWidth: 1,
          borderTopColor: "#2A2A2A",
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1A1A1A" }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Finders",
          headerRight: () => <HeaderRight><HomeComposeBtn /></HeaderRight>,
          tabBarLabel: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: "Jobs",
          headerRight: () => <HeaderRight><PostJobBtn shortWork={false} /></HeaderRight>,
          tabBarLabel: "Jobs",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: "New Post",
          headerRight: () => <HeaderRight />,
          tabBarLabel: "Post",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={32}
              color={Colors.light.primary}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="short-work"
        options={{
          title: "Short Work",
          headerRight: () => <HeaderRight><PostJobBtn shortWork={true} /></HeaderRight>,
          tabBarLabel: "Short Work",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "flash" : "flash-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          headerRight: () => <HeaderRight />,
          tabBarLabel: "Discover",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="messages" options={{ href: null, title: "Messages" }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: "Notifications" }} />
      <Tabs.Screen name="profile" options={{ href: null, title: "My Profile" }} />
    </Tabs>
  );
}
