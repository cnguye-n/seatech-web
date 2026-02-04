import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

type Role = "admin" | "member" | "viewer";

type AuthUser = {
  name: string;
  email: string;
  picture?: string;
  role: Role;
} | null;

type AuthContextValue = {
  user: AuthUser;
  isAuthenticated: boolean;
  loginWithGoogleToken: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GOOGLE_TOKEN_KEY = "google_credential";

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}
const API_BASE = "http://localhost:5001";

async function fetchMe(token: string) {
  const res = await fetch(`${API_BASE}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Not authorized");
  return res.json() as Promise<{
    name: string;
    email: string;
    picture?: string;
    role: Role;
  }>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);

  // Load existing session from localStorage on first render
  useEffect(() => {
    const token = localStorage.getItem(GOOGLE_TOKEN_KEY);
    if (!token) return;

    (async () => {
      try {
        const me = await fetchMe(token);
        setUser({
          name: me.name,
          email: me.email,
          picture: me.picture,
          role: me.role ?? "viewer",
        });
      } catch {
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
        setUser(null);
      }
    })();
  }, []);

  const loginWithGoogleToken = (token: string) => {
    // TEMP: force save so we can see if something clears it
    localStorage.setItem(GOOGLE_TOKEN_KEY, token);
    console.log(
      "localStorage after set:",
      localStorage.getItem(GOOGLE_TOKEN_KEY)
    );

    (async () => {
      try {
        const me = await fetchMe(token);

        setUser({
          name: me.name,
          email: me.email,
          picture: me.picture,
          role: me.role ?? "viewer",
        });
      } catch (err) {
        console.error("fetchMe failed:", err);
        localStorage.removeItem(GOOGLE_TOKEN_KEY);
        setUser(null);
      }
    })();
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem(GOOGLE_TOKEN_KEY);
  };

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
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
