"use client";

import { useInstallmentsOverview } from "@/features/installments/hooks/useInstallmentsOverview";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function InstallmentsPage() {
  const { data, isLoading, error } = useInstallmentsOverview();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-red-500">
        Error cargando cuotas
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Mis cuotas</h1>
        <p className="text-muted-foreground text-sm">
          Panorama actual de tus tarjetas y resumen abierto
        </p>
      </div>

      {/* Totales */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            Deuda total pendiente
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(data.totalDebtCents)}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-sm text-muted-foreground">
            En próximo resumen
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(data.totalNextStatementCents)}
          </p>
        </Card>
      </div>

      {/* Por tarjeta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.cards.map((card) => (
          console.log(card.backgroundColor),
          <Card
            key={card.cardId}
            className="p-6 rounded-2xl shadow-sm"
            style={{
              backgroundColor: card.backgroundColor ?? "#ffffff",
            }}
          >
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold">{card.name}</h2>
              <p className="text-sm opacity-80">
                Límite total: {formatCurrency(card.limitCents)}
              </p>
            </div>

            {/* Grid info */}
            <div className="grid grid-cols-2 gap-4 text-sm">

              <div>
                <p className="opacity-70">Cuotas activas</p>
                <p className="text-lg font-semibold">
                  {card.activeInstallmentsCount}
                </p>
              </div>

              <div>
                <p className="opacity-70">Total en período</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(card.openStatementAccumulatedCents)}
                </p>
              </div>

              <div>
                <p className="opacity-70">Cierre</p>
                <p className="font-medium">
                  {card.openStatement
                    ? new Date(
                      card.openStatement.closingDate
                    ).toLocaleDateString()
                    : "—"}
                </p>
              </div>

              <div>
                <p className="opacity-70">Vencimiento</p>
                <p className="font-medium">
                  {card.openStatement
                    ? new Date(
                      card.openStatement.dueDate
                    ).toLocaleDateString()
                    : "—"}
                </p>
              </div>

            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}