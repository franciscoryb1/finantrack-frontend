"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CreditCardForm } from "./CreditCardForm";
import { useCreateCreditCard } from "../hooks/useCreateCreditCard";
import { useState } from "react";
import { CreditCardFormValues } from "@/features/credit-cards/schemas/schema";

export function CreateCreditCardDialog() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateCreditCard();

  async function handleSubmit(values: CreditCardFormValues) {
    const payload = {
      name: values.name,
      brand: values.brand,
      bankAccountId: values.bankAccountId,
      limitCents: values.limit * 100,
      cardLast4: values.cardLast4,
      cardExpiresAt: new Date(
        values.expiryYear,
        values.expiryMonth - 1,
        1
      ).toISOString(),
      isActive: values.isActive,
    };v    

    await mutation.mutateAsync(payload);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva tarjeta</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear tarjeta</DialogTitle>
        </DialogHeader>

        <CreditCardForm
          onSubmit={handleSubmit}
          submitLabel="Crear tarjeta"
        />
      </DialogContent>
    </Dialog>
  );
}