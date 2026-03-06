"use client";

import { useParams } from "next/navigation";
import { useCreditCardSummary } from "@/features/credit-cards/hooks/useCreditCardSummary";

export default function CreditCardDetailPage() {
  const params = useParams();
  const cardId = Number(params.id);

  const { data, isLoading } = useCreditCardSummary(cardId);

  if (isLoading) {
    return <div>Cargando resumen...</div>;
  }

  if (!data) {
    return <div>No se encontró la tarjeta</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Detalle tarjeta</h1>

      <div className="border rounded-xl p-4 space-y-2">
        <div>Límite: ${(data.limitCents / 100).toFixed(2)}</div>
        <div>
          Disponible: ${(data.availableCents / 100).toFixed(2)}
        </div>
        <div>
          Comprometido: ${(data.committedCents / 100).toFixed(2)}
        </div>
      </div>

      {data.openStatement && (
        <div className="border rounded-xl p-4">
          <div className="font-semibold">
            Statement abierto
          </div>
          <div>
            Cierre:{" "}
            {(() => {
              const [y, m, d] = data.openStatement.closingDate.slice(0, 10).split("-").map(Number);
              return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
            })()}
          </div>
          <div>
            Vencimiento:{" "}
            {(() => {
              const [y, m, d] = data.openStatement.dueDate.slice(0, 10).split("-").map(Number);
              return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}