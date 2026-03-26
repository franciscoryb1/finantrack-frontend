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
import { Plus } from "lucide-react";
import { DiscardChangesAlert } from "@/components/ui/discard-changes-alert";

const FORM_ID = "create-credit-card-form";

export function CreateCreditCardDialog() {
  const [open, setOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const mutation = useCreateCreditCard();

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
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Nueva tarjeta
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 sm:max-w-2xl max-h-[90vh]">
        <DialogHeader className="px-6 pb-4 border-b shrink-0">
          <DialogTitle>Nueva tarjeta de crédito</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <CreditCardForm onSubmit={handleSubmit} formId={FORM_ID} onDirtyChange={setIsDirty} />
        </div>

        <div className="shrink-0 px-6 pt-3 pb-5 border-t">
          <Button
            type="submit"
            form={FORM_ID}
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Creando..." : "Crear tarjeta"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
