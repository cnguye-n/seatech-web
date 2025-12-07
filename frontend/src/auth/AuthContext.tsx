import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

type AuthUser = {
  name: string;
  email: string;
  picture?: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);

  // Load existing session from localStorage on first render
  useEffect(() => {
    const token = localStorage.getItem(GOOGLE_TOKEN_KEY);
    if (!token) return;

    const payload = parseJwt(token);
    if (payload) {
      setUser({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
    } else {
      localStorage.removeItem(GOOGLE_TOKEN_KEY);
    }
  }, []);

  const loginWithGoogleToken = (token: string) => {
    localStorage.setItem(GOOGLE_TOKEN_KEY, token);
    const payload = parseJwt(token);
    if (payload) {
      setUser({
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      });
    }
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
