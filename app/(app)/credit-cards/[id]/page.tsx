"use client";

import { useParams } from "next/navigation";
import { useCreditCardSummary } from "@/features/credit-cards/hooks/useCreditCardSummary";

export default function CreditCardDetailPage() {
  const params = useParams();
  const cardId = Number(params.id);

  const { data, isLoading } = useCreditCardSummary(cardId);

  if (isLoading) {
    return <div className="p-6">Cargando resumen...</div>;
  }

  if (!data) {
    return <div className="p-6">No se encontró la tarjeta</div>;
  }

  return (
    <div className="p-6 space-y-6">
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
            {new Date(data.openStatement.closingDate).toLocaleDateString()}
          </div>
          <div>
            Vencimiento:{" "}
            {new Date(data.openStatement.dueDate).toLocaleDateString()}
          </div>
        </div>
      )}
    </div>
  );
}