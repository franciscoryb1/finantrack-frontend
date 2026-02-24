"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const nav = [
  { href: "/", label: "Inicio" },
  { href: "/movements", label: "Movimientos" },
  { href: "/categories", label: "Categorías" },
  { href: "/accounts", label: "Cuentas" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4 flex flex-col gap-3">
        <div className="font-semibold text-lg">Finantrack</div>
        <div className="text-sm text-muted-foreground">demo@test.com</div>

        <Separator />

        <nav className="flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm hover:bg-accent ${
                  active ? "bg-accent font-medium" : ""
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => (window.location.href = "/login")}
          >
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}