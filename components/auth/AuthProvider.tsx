"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { me, refresh, logout as logoutApi } from "@/lib/auth";

type User = {
  userId: number;
  email: string;
  emailVerified: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function bootstrap() {
    try {
      const data = await me();
      setUser(data.user);
    } catch {
      try {
        await refresh();
        const data = await me();
        setUser(data.user);
      } catch {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  async function logout() {
    await logoutApi();
    setUser(null);
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}