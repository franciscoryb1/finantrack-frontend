"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { resetPassword } from "@/lib/auth";
import { Logo } from "@/components/Logo";
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
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

const schema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(100),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Las contraseñas no coinciden" });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  useEffect(() => { document.title = "Nueva contraseña | Finantrack"; }, []);

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: FormValues) {
    if (!token) { setInvalidToken(true); return; }
    try {
      await resetPassword(token, values.password);
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("expired")) {
        setInvalidToken(true);
      } else {
        form.setError("root", { message: "Ocurrió un error. Intentá de nuevo." });
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Brand */}
        <div className="flex flex-col items-center gap-2">
          <Logo variant="top" />
          <p className="text-sm text-muted-foreground">Creá una nueva contraseña</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">

          {!token || invalidToken ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <div>
                <p className="font-semibold">Link inválido o expirado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  El link de recuperación expiró o ya fue usado. Solicitá uno nuevo.
                </p>
              </div>
              <Button asChild className="w-full mt-1">
                <Link href="/forgot-password">Solicitar nuevo link</Link>
              </Button>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <div>
                <p className="font-semibold">¡Contraseña actualizada!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Ya podés iniciar sesión con tu nueva contraseña.
                </p>
              </div>
              <Button asChild className="w-full mt-1">
                <Link href="/login">Ir al inicio de sesión</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>

                {form.formState.errors.root && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{form.formState.errors.root.message}</span>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nueva contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Mínimo 8 caracteres"
                            className="pl-9 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label={showPassword ? "Ocultar" : "Mostrar"}
                            onClick={() => setShowPassword(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmá la contraseña</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            type={showConfirm ? "text" : "password"}
                            autoComplete="new-password"
                            placeholder="Repetí tu contraseña"
                            className="pl-9 pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            aria-label={showConfirm ? "Ocultar" : "Mostrar"}
                            onClick={() => setShowConfirm(v => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Guardando..." : "Cambiar contraseña"}
                </Button>
              </form>
            </Form>
          )}
        </div>

        {!success && !invalidToken && token && (
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Volver al inicio de sesión
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
