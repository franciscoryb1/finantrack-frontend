"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { MovementForm } from "./MovementForm";
import { useCreateMovement } from "../hooks/useCreateMovement";
import { useCreateCreditCardPurchase } from "@/features/credit-card-purchases/hooks/useCreateCreditCardPurchase";
import { MovementFormValues } from "../schemas/movement.schema";

export function CreateMovementDialog() {
  const [open, setOpen] = useState(false);
  const createMovement = useCreateMovement();
  const createPurchase = useCreateCreditCardPurchase();

  async function handleSubmit(values: MovementFormValues) {
    // Parsear como fecha local (mediodía) para evitar saltos de día por timezone.
    // new Date("2026-03-01") interpreta como UTC midnight, lo que en UTC-3 es el 28/02.
    const [y, m, d] = values.occurredAt.split("-").map(Number);
    const occurredAt = new Date(y, m - 1, d, 12, 0, 0).toISOString();

    try {
      if (values.paymentMethod === "CREDIT_CARD") {
        await createPurchase.mutateAsync({
          creditCardId: values.creditCardId!,
          totalAmountCents: Math.round(values.amount * 100),
          installmentsCount: values.installmentsCount!,
          categoryId: values.categoryId,
          description: values.description || undefined,
          occurredAt,
        });
      } else {
        await createMovement.mutateAsync({
          type: values.type,
          amountCents: Math.round(values.amount * 100),
          accountId: values.accountId!,
          categoryId: values.categoryId,
          description: values.description || undefined,
          occurredAt,
        });
      }
      setOpen(false);
    } catch {
      // el toast de error lo muestra el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo movimiento
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>

        <MovementForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
