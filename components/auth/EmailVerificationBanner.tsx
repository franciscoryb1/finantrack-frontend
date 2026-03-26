"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { resendVerification } from "@/lib/auth";
import { MailWarning, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified || dismissed) return null;

  async function handleResend() {
    setSending(true);
    try {
      await resendVerification();
      toast.success("Email de verificación enviado. Revisá tu bandeja.");
    } catch {
      toast.error("No se pudo enviar el email. Intentá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5">
      <div className="max-w-screen-xl mx-auto flex items-center gap-3">
        <MailWarning className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-300 flex-1 min-w-0">
          Verificá tu email para asegurar tu cuenta.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 px-2"
            onClick={handleResend}
            disabled={sending}
          >
            {sending ? "Enviando..." : "Reenviar email"}
          </Button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Cerrar"
            className="text-amber-500 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
