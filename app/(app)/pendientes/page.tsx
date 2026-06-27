"use client";

import { useEffect } from "react";
import { usePendingPurchases } from "@/features/pending-purchases/hooks/usePendingPurchases";
import { PendingPurchaseCard } from "@/features/pending-purchases/components/PendingPurchaseCard";
import { Inbox } from "lucide-react";

export default function PendingPurchasesPage() {
  useEffect(() => {
    document.title = "Pendientes | Finantrack";
  }, []);

  const { data: pending = [], isLoading } = usePendingPurchases();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Pendientes de revisión</h1>
          <p className="text-sm text-muted-foreground">
            Consumos detectados en tus emails bancarios. Revisalos y confirmalos.
          </p>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground/50" />
          <div>
            <p className="font-medium">No hay consumos pendientes</p>
            <p className="text-sm text-muted-foreground">
              Cuando llegue un consumo por email, va a aparecer acá para que lo
              revises.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => (
            <PendingPurchaseCard key={p.id} purchase={p} />
          ))}
        </div>
      )}
    </div>
  );
}
