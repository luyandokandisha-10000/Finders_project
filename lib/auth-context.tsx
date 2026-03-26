import React, { createContext, useContext, useMemo, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, setToken, clearToken, getToken, getApiUrl } from "./query-client";
import type { User } from "@shared/schema";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  const login = async (email: string, password: string) => {
    const baseUrl = getApiUrl();
    const url = new URL("/api/auth/login", baseUrl);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Login failed" }));
      throw new Error(errData.message || "Login failed");
    }

    const data = await res.json();
    await setToken(data.token);
    queryClient.setQueryData(["/api/auth/me"], data.user);
  };

  const register = async (email: string, password: string, fullName?: string, role?: string) => {
    const baseUrl = getApiUrl();
    const url = new URL("/api/auth/register", baseUrl);
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName, role }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({ message: "Registration failed" }));
      throw new Error(errData.message || "Registration failed");
    }

    const data = await res.json();
    await setToken(data.token);
    queryClient.setQueryData(["/api/auth/me"], data.user);
  };

  const logout = async () => {
    const token = await getToken();
    try {
      const baseUrl = getApiUrl();
      const url = new URL("/api/auth/logout", baseUrl);
      await fetch(url.toString(), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (e) {}
    await clearToken();
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  const updateProfile = async (data: Partial<User>) => {
    const token = await getToken();
    const baseUrl = getApiUrl();
    const url = new URL("/api/profile", baseUrl);
    const res = await fetch(url.toString(), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error("Failed to update profile");
    }

    const updated = await res.json();
    queryClient.setQueryData(["/api/auth/me"], updated);
  };

  const value = useMemo(
    () => ({
      user: user ?? null,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
      refetchUser: refetch,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
