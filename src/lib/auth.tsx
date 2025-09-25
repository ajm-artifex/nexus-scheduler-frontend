"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { apiGet } from "./api";

type User = {
  user_id: number;
  email: string;
  full_name: string;
  role: "student" | "ssm" | "admin";
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap session from token if present
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      apiGet<User>("/auth/me")
        .then(setUser)
        .catch(() => {
          localStorage.removeItem("access_token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Store token, then refresh /auth/me
  const login = (token: string) => {
    localStorage.setItem("access_token", token);
    apiGet<User>("/auth/me")
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("access_token");
        setUser(null);
      });
  };

  // Best-effort backend logout + local clear
  const logout = () => {
    (async () => {
      try {
        await fetch(
          `${
            process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
          }/auth/logout`,
          { method: "POST", credentials: "include" }
        );
      } catch {
        // ignore network errors; we still clear local state
      } finally {
        localStorage.removeItem("access_token");
        setUser(null);
      }
    })();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
