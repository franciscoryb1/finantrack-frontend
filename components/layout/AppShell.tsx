"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4 flex flex-col gap-4">
        <div className="font-bold text-lg">Finantrack</div>
        <div className="text-sm text-muted-foreground">{user.email}</div>

        <Link href="/">Inicio</Link>

        <div className="mt-auto">
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}