"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { resendVerification } from "@/lib/auth";
import { Mail, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) return null;
  if (user.emailVerified) return <>{children}</>;

  async function handleResend() {
    setSending(true);
    try {
      await resendVerification();
      toast.success("Email enviado. Revisá tu bandeja de entrada.");
    } catch {
      toast.error("No se pudo enviar el email. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground text-xl font-black tracking-tight">F</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Finantrack</h1>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold">Verificá tu email para continuar</p>
              <p className="text-sm text-muted-foreground mt-1">
                Te enviamos un link a{" "}
                <span className="font-medium text-foreground">{user.email}</span>.
                Hacé clic en el link del correo para activar tu cuenta.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full" onClick={handleResend} disabled={sending}>
              {sending ? "Enviando..." : "Reenviar email de verificación"}
            </Button>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-1.5" />
              Ya verifiqué, actualizar
            </Button>
          </div>
        </div>

        <p className="text-center">
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión
          </button>
        </p>

      </div>
    </div>
  );
}
