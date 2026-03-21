"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth";
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
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const schema = z.object({
  email: z.string().min(1, "El email es requerido").email("Ingresá un email válido"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  useEffect(() => { document.title = "Recuperar contraseña | Finantrack"; }, []);

  const [sent, setSent] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: FormValues) {
    await forgotPassword(values.email.trim().toLowerCase());
    setSent(true);
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
            <p className="text-sm text-muted-foreground mt-1">Recuperar contraseña</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl border shadow-sm p-6 space-y-5">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-2 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="font-medium">Revisá tu correo</p>
              <p className="text-sm text-muted-foreground">
                Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña. El enlace expira en 1 hora.
              </p>
              <Link href="/login" className="text-sm text-primary hover:underline font-medium mt-1">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>

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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? "Enviando..." : "Enviar enlace"}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary hover:underline font-medium inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inicio de sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
