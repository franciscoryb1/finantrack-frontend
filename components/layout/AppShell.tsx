"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Tag,
  CreditCard,
  Receipt,
  LogOut,
  Menu,
  User,
} from "lucide-react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type NavItemDef = {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
};

// ── Navegación ────────────────────────────────────────────────────────────────

const MAIN_NAV: NavItemDef[] = [
  { href: "/",           label: "Inicio",       icon: LayoutDashboard, exact: true },
  { href: "/movements",  label: "Movimientos",  icon: ArrowLeftRight },
  { href: "/accounts",   label: "Cuentas",      icon: Landmark },
  { href: "/categories", label: "Categorías",   icon: Tag },
];

const CARDS_NAV: NavItemDef[] = [
  { href: "/credit-cards",  label: "Mis tarjetas", icon: CreditCard },
  { href: "/installments",  label: "Mis cuotas",   icon: Receipt },
];

// ── NavItem ───────────────────────────────────────────────────────────────────

function NavItem({
  href,
  label,
  icon: Icon,
  exact,
  onClick,
}: NavItemDef & { onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground font-medium hover:text-foreground hover:bg-accent"
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
      {label}
    </Link>
  );
}

// ── Sección de usuario ────────────────────────────────────────────────────────

function UserSection({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");
  const initials = profile?.firstName
    ? profile.lastName
      ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
      : profile.firstName.slice(0, 2).toUpperCase()
    : (user?.email?.slice(0, 2).toUpperCase() ?? "?");

  return (
    <div className="border-t pt-3 space-y-1">
      {/* Avatar + info */}
      <div className="flex items-center gap-3 px-2 py-1">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0 select-none">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          {fullName ? (
            <>
              <p className="text-sm font-medium leading-tight truncate">{fullName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </>
          ) : (
            <p className="text-sm font-medium truncate">{user?.email}</p>
          )}
        </div>
      </div>

      {/* Acciones */}
      <Link href="/profile" onClick={onNavigate}>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground px-2"
        >
          <User className="h-3.5 w-3.5" />
          Mi perfil
        </Button>
      </Link>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive px-2"
          >
            <LogOut className="h-3.5 w-3.5" />
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
  );
}

// ── Contenido del sidebar ─────────────────────────────────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex flex-col h-full gap-1">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 py-3 mb-1">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground text-xs font-black tracking-tight">F</span>
        </div>
        <span className="font-bold text-base tracking-tight">Finantrack</span>
      </div>

      {/* Nav principal */}
      <nav className="space-y-0.5">
        {MAIN_NAV.map((item) => (
          <NavItem key={item.href} {...item} onClick={onNavigate} />
        ))}
      </nav>

      {/* Grupo Tarjetas */}
      <div className="mt-4 space-y-0.5">
        <p className="px-3 mb-1 text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50">
          Tarjetas
        </p>
        {CARDS_NAV.map((item) => (
          <NavItem key={item.href} {...item} onClick={onNavigate} />
        ))}
      </div>

      {/* Usuario — empujado al fondo */}
      <div className="mt-auto">
        <UserSection onNavigate={onNavigate} />
      </div>
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el Sheet al navegar
  useEffect(() => {
    setSheetOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading) return <div className="p-4 md:p-6 text-sm text-muted-foreground">Cargando...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* Sidebar desktop */}
      <aside className="hidden md:flex md:w-60 border-r bg-background flex-col p-4 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Header mobile */}
      <div className="md:hidden flex items-center justify-between border-b bg-background px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-[10px] font-black">F</span>
          </div>
          <span className="font-bold text-sm tracking-tight">Finantrack</span>
        </div>

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-4">
            <SidebarContent onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 p-4 md:p-6 min-w-0">{children}</main>
    </div>
  );
}
