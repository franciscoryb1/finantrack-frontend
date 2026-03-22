"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  useEffect(() => { document.title = "Verificar email | Finantrack"; }, []);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }

    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

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
        <div className="bg-card rounded-2xl border shadow-sm p-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              <p className="text-sm text-muted-foreground">Verificando tu email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <div>
                <p className="font-semibold">¡Email verificado!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Tu cuenta está activa. Ya podés usar Finantrack.
                </p>
              </div>
              <Button asChild className="w-full mt-1">
                <Link href="/">Ir al inicio</Link>
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <p className="font-semibold">Link inválido o expirado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  El link de verificación expiró o ya fue usado. Iniciá sesión para solicitar uno nuevo.
                </p>
              </div>
              <Button asChild className="w-full mt-1">
                <Link href="/login">Ir al inicio de sesión</Link>
              </Button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
