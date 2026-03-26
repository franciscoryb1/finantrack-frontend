import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-8 text-center">

        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-md">
            <span className="text-primary-foreground text-xl font-black tracking-tight">F</span>
          </div>
          <div>
            <p className="text-6xl font-black text-muted-foreground/20 leading-none">404</p>
            <h1 className="text-xl font-bold tracking-tight mt-2">Página no encontrada</h1>
            <p className="text-sm text-muted-foreground mt-1">
              La página que buscás no existe o fue movida.
            </p>
          </div>
        </div>

        <div className="bg-card rounded-2xl border shadow-sm p-5 flex flex-col items-center gap-2 text-muted-foreground">
          <SearchX className="h-8 w-8 opacity-40" />
          <p className="text-sm">
            Revisá la URL o volvé al inicio.
          </p>
        </div>

        <Button className="w-full" asChild>
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
        </Button>

      </div>
    </div>
  );
}
