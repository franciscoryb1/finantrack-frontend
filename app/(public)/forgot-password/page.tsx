"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth";
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
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "El email es requerido").email("Ingresá un email válido"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  useEffect(() => { document.title = "Recuperar contraseña | Finantrack"; }, []);

  const [success, setSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    form.clearErrors();
    try {
      await forgotPassword(values.email.trim().toLowerCase());
      setSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.toLowerCase().includes("no existe") || msg.toLowerCase().includes("not found")) {
        form.setError("email", { message: "No existe una cuenta con ese email." });
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
          <p className="text-sm text-muted-foreground">Recuperá tu contraseña</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle className="h-10 w-10 text-emerald-500" />
              <div>
                <p className="font-semibold">Revisá tu email</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Si el email está registrado, vas a recibir un link para restablecer tu contraseña.
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Ingresá tu email y te enviamos un link para crear una nueva contraseña.
              </p>

              {form.formState.errors.root && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{form.formState.errors.root.message}</span>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                  <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? "Enviando..." : "Enviar link"}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline font-medium">
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
