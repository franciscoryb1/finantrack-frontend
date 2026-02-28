"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { ChevronDown, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = "/login";
    }
  }, [loading, user]);

  if (loading) return <div className="p-4 md:p-6">Cargando...</div>;
  if (!user) return null;

  const sidebarContent = (
    <div className="flex flex-col gap-4 h-full">
      <div className="font-bold text-lg">Finantrack</div>
      <div className="text-sm text-muted-foreground">{user.email}</div>

      <Link href="/" className="px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent">
        Inicio
      </Link>
      
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between px-3">
            Tarjetas
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="ml-4 bg-accent rounded-md p-2 space-y-1">
          <Link
            href="/credit-cards"
            className="block px-3 py-2 rounded-md text-sm transition-colors hover:bg-secondary"
          >
            Mis tarjetas
          </Link>
          <Link
            href="/installments"
            className="block px-3 py-2 rounded-md text-sm transition-colors hover:bg-secondary"
          >
            Mis cuotas
          </Link>
        </CollapsibleContent>
      </Collapsible>

      <div className="mt-auto">
        <Button variant="outline" onClick={logout} className="w-full">
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex md:w-64 border-r p-4">
        {sidebarContent}
      </aside>

      {/* Mobile Header with Sheet */}
      <div className="md:hidden flex items-center justify-between border-b p-4">
        <div className="font-bold text-lg">Finantrack</div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-4">
            {sidebarContent}
          </SheetContent>
        </Sheet>
      </div>

      <main className="flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}