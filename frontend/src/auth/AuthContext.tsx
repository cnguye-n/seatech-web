import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type Role = "admin" | "member" | "public";

type AuthUser = {
  name: string;
  email: string;
  picture?: string;
  role: Role;
} | null;

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
  authLoading: boolean;
  loginWithGoogleToken: (token: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const GOOGLE_TOKEN_KEY = "google_credential";
const API_BASE = (import.meta.env.VITE_API_URL as string) ?? "";

async function fetchMe(token: string) {
  const res = await fetch(`${API_BASE}/api/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token.trim()}`,
    },
  });

  if (!res.ok) return null;

  return (await res.json()) as {
    name: string;
    email: string;
    picture?: string;
    role: Role;
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(GOOGLE_TOKEN_KEY);

    if (!token) {
      setAuthLoading(false);
      return;
    }

    (async () => {
      try {
        const me = await fetchMe(token);

        if (!me) {
          localStorage.removeItem(GOOGLE_TOKEN_KEY);
          setUser(null);
          return;
        }

        setUser({
          name: me.name,
          email: me.email,
          picture: me.picture,
          role: me.role ?? "public",
        });
      } catch (err) {
        console.error("Initial auth restore failed:", err);
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  const loginWithGoogleToken = async (token: string): Promise<boolean> => {
    setAuthLoading(true);
    localStorage.setItem(GOOGLE_TOKEN_KEY, token);

    try {
      const me = await fetchMe(token);

      if (!me) {
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
        setUser(null);
        return false;
      }

      setUser({
        name: me.name,
        email: me.email,
        picture: me.picture,
        role: me.role ?? "public",
      });

      return true;
    } catch (err) {
      console.error("fetchMe failed:", err);
      localStorage.removeItem(GOOGLE_TOKEN_KEY);
      setUser(null);
      return false;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    authLoading,
    loginWithGoogleToken,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}