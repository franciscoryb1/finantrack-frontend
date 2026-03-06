"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";

// ── Seguridad: rate limiting client-side ──────────────────────────────────────

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

// ── Schema ────────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "El email es requerido")
    .email("Ingresá un email válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Página ────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const lockUntilRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocked = countdown > 0;

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Limpia el timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function startLockout() {
    lockUntilRef.current = Date.now() + LOCKOUT_SECONDS * 1000;
    setCountdown(LOCKOUT_SECONDS);

    timerRef.current = setInterval(() => {
      const remaining = Math.ceil((lockUntilRef.current! - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current!);
        setCountdown(0);
        setAttempts(0);
        lockUntilRef.current = null;
      } else {
        setCountdown(remaining);
      }
    }, 500);
  }

  async function onSubmit(values: LoginFormValues) {
    if (isLocked) return;
    setAuthError(null);

    const email = values.email.trim().toLowerCase();

    try {
      await login(email, values.password);

      // Credential Management API: le indica al browser que guarde/actualice las credenciales
      if (
        typeof window !== "undefined" &&
        "credentials" in navigator &&
        "PasswordCredential" in window
      ) {
        try {
          const cred = new (window as any).PasswordCredential({
            id: email,
            password: values.password,
          });
          await navigator.credentials.store(cred);
        } catch {
          // No crítico — el browser puede ignorarlo si el usuario rechazó guardar antes
        }
      }

      window.location.href = "/";
    } catch {
      // Mensaje genérico: no revelar si el email existe o no
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        startLockout();
      } else {
        setAuthError("Email o contraseña incorrectos.");
      }
    }
  }

  const remainingAttempts = MAX_ATTEMPTS - attempts;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground text-xl font-black tracking-tight">F</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Finantrack</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresá a tu cuenta
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">

          {/* Bloqueo temporal */}
          {isLocked && (
            <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Demasiados intentos fallidos. Podés intentar de nuevo en{" "}
                <span className="font-semibold">{countdown}s</span>.
              </span>
            </div>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4"
              noValidate
            >
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          placeholder="tu@email.com"
                          className="pl-9"
                          disabled={isLocked}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contraseña */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="pl-9 pr-10"
                          disabled={isLocked}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              form.handleSubmit(onSubmit)();
                            }
                          }}
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword
                            ? <EyeOff className="h-4 w-4" />
                            : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Error de autenticación */}
              {authError && !isLocked && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Aviso de intentos restantes */}
              {attempts > 0 && !isLocked && remainingAttempts <= 2 && (
                <p className="text-xs text-muted-foreground text-center">
                  {remainingAttempts === 1
                    ? "1 intento restante antes del bloqueo temporal."
                    : `${remainingAttempts} intentos restantes antes del bloqueo temporal.`}
                </p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting || isLocked}
              >
                {form.formState.isSubmitting ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Tu sesión está protegida con JWT y cookies httpOnly.
        </p>
      </div>
    </div>
  );
}
