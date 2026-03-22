"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useUpdateProfile } from "@/features/profile/hooks/useUpdateProfile";
import { useChangePassword } from "@/features/profile/hooks/useChangePassword";
import {
  profileSchema,
  changePasswordSchema,
  ProfileFormValues,
  ChangePasswordFormValues,
} from "@/features/profile/schemas/profile.schema";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Separator } from "@/components/ui/separator";
import { Pencil, LogOut, KeyRound, User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ── Avatar con iniciales ──────────────────────────────────────────────────────

function Avatar({ firstName, lastName, email }: { firstName?: string | null; lastName?: string | null; email: string }) {
  const initials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : firstName
    ? firstName.slice(0, 2).toUpperCase()
    : email.slice(0, 2).toUpperCase();
  return (
    <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shrink-0">
      {initials}
    </div>
  );
}

// ── Sección: Info personal ────────────────────────────────────────────────────

function ProfileSection() {
  const [editing, setEditing] = useState(false);
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: profile?.firstName ?? "",
      lastName: profile?.lastName ?? "",
      email: profile?.email ?? "",
      phoneNumber: profile?.phoneNumber ?? "",
    },
  });

  async function handleSubmit(values: ProfileFormValues) {
    await updateProfile.mutateAsync({
      firstName: values.firstName !== (profile?.firstName ?? "") ? values.firstName : undefined,
      lastName: values.lastName !== (profile?.lastName ?? "") ? values.lastName : undefined,
      email: values.email !== profile?.email ? values.email : undefined,
      phoneNumber: values.phoneNumber !== profile?.phoneNumber ? values.phoneNumber : undefined,
    });
    setEditing(false);
  }

  function handleCancel() {
    form.reset();
    setEditing(false);
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es-AR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Información personal
          </CardTitle>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {editing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} />
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
                        <Input placeholder="Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+54 9 11 1234-5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Guardando..." : "Guardar"}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              {profile && (
                <Avatar
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  email={profile.email}
                />
              )}
              <div>
                {(profile?.firstName || profile?.lastName) && (
                  <p className="font-semibold">
                    {[profile.firstName, profile.lastName].filter(Boolean).join(" ")}
                  </p>
                )}
                <p className="font-medium text-sm">{profile?.email}</p>
                <p className="text-sm text-muted-foreground">
                  {profile?.phoneNumber || "Sin teléfono registrado"}
                </p>
              </div>
            </div>
            {memberSince && (
              <p className="text-xs text-muted-foreground">
                Miembro desde {memberSince}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Sección: Cambiar contraseña ───────────────────────────────────────────────

function ChangePasswordSection() {
  const changePassword = useChangePassword();

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function handleSubmit(values: ChangePasswordFormValues) {
    await changePassword.mutateAsync({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    form.reset();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" />
          Cambiar contraseña
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña actual</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
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
                  <FormLabel>Confirmar nueva contraseña</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" size="sm" disabled={changePassword.isPending}>
              {changePassword.isPending ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  useEffect(() => { document.title = "Mi perfil | Finantrack"; }, []);

  const { logout } = useAuth();

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">Mi perfil</h1>

      <ProfileSection />
      <ChangePasswordSection />

      <Separator />

      <div>
        <p className="text-sm font-medium mb-2">Sesión</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
              <AlertDialogDescription>
                Vas a salir de tu cuenta. Podés volver a ingresar cuando quieras.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={logout}>Cerrar sesión</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
