"use client";

import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { CreateCreditCardDialog } from "@/features/credit-cards/components/CreateCreditCardDialog";
import { CreditCardItem } from "@/features/credit-cards/components/CreditCardItem";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CreditCardsPage() {
  const { data, isLoading, error } = useCreditCards();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive">
        Error al cargar tarjetas.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Tarjetas de crédito
        </h1>

        <CreateCreditCardDialog />
      </div>

      {data?.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No tenés tarjetas creadas todavía.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {data?.map((card) => (
          <CreditCardItem
            key={card.id}
            card={card}
          />
        ))}
      </div>
    </div>
  );
}