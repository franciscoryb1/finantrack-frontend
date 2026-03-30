"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { register as registerUser, login } from "@/lib/auth";
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
import { Mail, Lock, Eye, EyeOff, User, Phone, AlertCircle, Check } from "lucide-react";

// ── Schema ────────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, "El email es requerido")
      .email("Ingresá un email válido"),
    firstName: z
      .string()
      .min(1, "El nombre es requerido")
      .max(100, "Máximo 100 caracteres"),
    lastName: z
      .string()
      .min(1, "El apellido es requerido")
      .max(100, "Máximo 100 caracteres"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(100, "Máximo 100 caracteres"),
    confirmPassword: z.string().min(1, "Confirmá tu contraseña"),
    phoneNumber: z
      .string()
      .regex(/^\+?\d[\d\s\-().]{6,28}$/, "Ingresá un número de teléfono válido")
      .max(30, "Máximo 30 caracteres")
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Las contraseñas no coinciden",
      });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

// ── Password strength ─────────────────────────────────────────────────────────

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Muy débil", color: "bg-red-500" };
  if (score === 2) return { score, label: "Débil", color: "bg-orange-500" };
  if (score === 3) return { score, label: "Moderada", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Fuerte", color: "bg-emerald-500" };
  return { score, label: "Muy fuerte", color: "bg-emerald-600" };
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function RegisterPage() {
  useEffect(() => { document.title = "Crear cuenta | Finantrack"; }, []);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  const passwordValue = form.watch("password");
  const strength = getPasswordStrength(passwordValue);

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);

    const email = values.email.trim().toLowerCase();

    try {
      await registerUser({
        email,
        password: values.password,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phoneNumber: values.phoneNumber?.trim() || undefined,
      });

      // Auto-login after registration
      await login(email, values.password);
      window.location.href = "/";
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("Email already registered")) {
        form.setError("email", { message: "Este email ya está registrado" });
      } else if (message.includes("Phone already registered")) {
        form.setError("phoneNumber", { message: "Este número de teléfono ya está registrado" });
      } else {
        setServerError("Ocurrió un error al crear la cuenta. Intentá de nuevo.");
      }
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
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Finantrack</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Creá tu cuenta
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">

          {serverError && (
            <div className="flex items-start gap-2.5 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
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
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nombre + Apellido */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                          <Input
                            autoComplete="given-name"
                            placeholder="Juan"
                            className="pl-9"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="family-name"
                          placeholder="Pérez"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
                          autoComplete="new-password"
                          placeholder="Mínimo 8 caracteres"
                          className="pl-9 pr-10"
                          {...field}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    {/* Indicador de fortaleza */}
                    {passwordValue && (
                      <div className="space-y-1 pt-0.5">
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-muted"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">{strength.label}</p>
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Confirmar contraseña */}
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmá tu contraseña</FormLabel>
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
                          aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                          onClick={() => setShowConfirm((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    {/* Match indicator */}
                    {field.value && passwordValue && field.value === passwordValue && (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="h-3 w-3" /> Las contraseñas coinciden
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {/* Teléfono (opcional) */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Teléfono{" "}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="+54 11 1234-5678"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
              </Button>
            </form>
          </Form>
        </div>

        <div className="flex flex-col items-center gap-1.5 text-sm text-muted-foreground text-center">
          <p>
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Iniciá sesión
            </Link>
          </p>
          <p>
            ¿Olvidaste tu contraseña?{" "}
            <Link href="/forgot-password" className="text-primary hover:underline font-medium">
              Recuperala
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
