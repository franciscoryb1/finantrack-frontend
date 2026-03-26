"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { CreditCardForm } from "./CreditCardForm";
import { useUpdateCreditCard } from "../hooks/useUpdateCreditCard";
import { CreditCard } from "../api/credit-cards.api";
import { CreditCardFormValues } from "@/features/credit-cards/schemas/schema";
import { DiscardChangesAlert } from "@/components/ui/discard-changes-alert";

const FORM_ID = "edit-credit-card-form";

type Props = {
  card: CreditCard;
};

export function EditCreditCardDialog({ card }: Props) {
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const mutation = useUpdateCreditCard(card.id);

  async function handleSubmit(values: CreditCardFormValues) {
    const payload = {
      name: values.name,
      brand: values.brand,
      bankAccountId: values.bankAccountId,
      limitCents: values.limit * 100,
      cardLast4: values.cardLast4,
      cardExpiresAt: new Date(values.expiryYear, values.expiryMonth - 1, 1).toISOString(),
      isActive: values.isActive,
      backgroundColor: values.backgroundColor || undefined,
    };

    try {
      await mutation.mutateAsync(payload);
      setOpen(false);
    } catch {
      // el toast de error lo muestra el hook
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o && isDirty) { setConfirmDiscard(true); return; }
    setOpen(o);
  }

  return (
    <>
    <DiscardChangesAlert
      open={confirmDiscard}
      onConfirm={() => { setConfirmDiscard(false); setOpen(false); }}
      onCancel={() => setConfirmDiscard(false)}
    />
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">Editar</Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 sm:max-w-2xl max-h-[90vh]">
        <DialogHeader className="px-6 pb-4 border-b shrink-0">
          <DialogTitle>Editar tarjeta</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <CreditCardForm
            defaultValues={{
              name: card.name,
              brand: (card.brand as "VISA" | "MASTERCARD") ?? "VISA",
              limit: card.limitCents / 100,
              cardLast4: card.cardLast4,
              bankAccountId: card.bankAccount.id,
              expiryMonth: new Date(card.cardExpiresAt).getUTCMonth() + 1,
              expiryYear: new Date(card.cardExpiresAt).getUTCFullYear(),
              backgroundColor: card.backgroundColor ?? "",
            }}
            onSubmit={handleSubmit}
            formId={FORM_ID}
            onDirtyChange={setIsDirty}
          />
        </div>

        <div className="shrink-0 px-6 pt-3 pb-5 border-t">
          <Button
            type="submit"
            form={FORM_ID}
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
