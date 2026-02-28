"use client";

import Link from "next/link";
import { CreditCard } from "../api/credit-cards.api";
import { EditCreditCardDialog } from "./EditCreditCardDialog";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = {
  card: CreditCard;
};

export function CreditCardItem({ card }: Props) {
  return (
    <Card>
      <CardContent className="p-4 flex justify-between items-center gap-3">
        {/* Info clickable */}
        <Link
          href={`/credit-cards/${card.id}`}
          className="space-y-1 min-w-0 flex-1"
        >
          <div className="font-semibold truncate">
            {card.name}
          </div>

          <div className="text-sm text-muted-foreground">
            **** {card.cardLast4}
          </div>

          <div className="text-sm">
            Límite: $
            {(card.limitCents / 100).toFixed(2)}
          </div>
        </Link>

        {/* Acción secundaria */}
        <div className="shrink-0">
          <EditCreditCardDialog card={card} />
        </div>
      </CardContent>
    </Card>
  );
}