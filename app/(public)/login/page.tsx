"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // por ahora solo simulamos
      // en el paso siguiente lo conectamos al backend
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <h1 className="text-xl font-semibold">Ingresar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Usá tu email y contraseña.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <div className="space-y-1">
              <label className="text-sm">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Ingresando..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}