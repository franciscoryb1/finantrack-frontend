"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: Props) {
  useEffect(() => {
    console.error("[Error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-8 text-center">

        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Algo salió mal</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-4 text-left">
          <p className="text-xs font-mono text-muted-foreground break-all">
            {error.message || "Error desconocido"}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Intentar de nuevo
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Volver al inicio
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
