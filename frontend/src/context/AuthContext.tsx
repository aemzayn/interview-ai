"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { UserPublic, TokenResponse } from "@/types";
import { api } from "@/lib/api";

const TOKEN_KEY = "iait"; // interview_ai_token

interface AuthContextValue {
  user: UserPublic | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }
    api.auth
      .me()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const _persist = (res: TokenResponse) => {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    setUser(res.user);
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    _persist(res);
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const res = await api.auth.register(email, password, displayName);
      _persist(res);
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
