import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "./query-client";
import type { User } from "@shared/schema";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<void>;
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
    const res = await apiRequest("POST", "/api/auth/login", { email, password });
    const userData = await res.json();
    queryClient.setQueryData(["/api/auth/me"], userData);
  };

  const register = async (email: string, password: string, fullName?: string) => {
    const res = await apiRequest("POST", "/api/auth/register", { email, password, fullName });
    const userData = await res.json();
    queryClient.setQueryData(["/api/auth/me"], userData);
  };

  const logout = async () => {
    await apiRequest("POST", "/api/auth/logout");
    queryClient.setQueryData(["/api/auth/me"], null);
    queryClient.clear();
  };

  const updateProfile = async (data: Partial<User>) => {
    const res = await apiRequest("PUT", "/api/profile", data);
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
