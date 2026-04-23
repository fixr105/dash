import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiClient } from "../services/apiClient";

export interface AuthMembership {
  scope: string;
  role: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  memberships: AuthMembership[];
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.get<{ user: AuthUser }>("/auth/me");
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiClient.post<{ token: string; user: AuthUser }>("/auth/login", {
      email,
      password,
    });
    setUser(response.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      logout,
    }),
    [isLoading, login, logout, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider.");
  }
  return context;
}
