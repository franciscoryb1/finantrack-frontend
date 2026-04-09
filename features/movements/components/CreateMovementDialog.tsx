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
import { DiscardChangesAlert } from "@/components/ui/discard-changes-alert";

type Props = {
  initialValues?: Partial<MovementFormValues>;
  label?: string;
  trigger?: React.ReactNode;
};

export function CreateMovementDialog({ initialValues, label = "Nuevo movimiento", trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const createMovement = useCreateMovement();
  const createPurchase = useCreateCreditCardPurchase();

  async function handleSubmit(values: MovementFormValues) {
    setServerError(null);
    const occurredAt = `${values.occurredAt}T${values.occurredAtTime}:00-03:00`;

    try {
      const sharedAmountCents = values.sharedAmount ? Math.round(values.sharedAmount * 100) : undefined;

      if (values.paymentMethod === "CREDIT_CARD") {
        let reimbursementAt: string | undefined;
        if (values.reimbursementEnabled && values.reimbursementAt) {
          reimbursementAt = `${values.reimbursementAt}T12:00:00-03:00`;
        }
        await createPurchase.mutateAsync({
          creditCardId: values.creditCardId!,
          totalAmountCents: Math.round(values.amount * 100),
          installmentsCount: values.installmentsCount!,
          categoryId: values.categoryId,
          description: values.description || undefined,
          occurredAt,
          tagIds: values.tagIds?.length ? values.tagIds : undefined,
          ...(values.reimbursementEnabled && values.reimbursementAmount && values.reimbursementAccountId && {
            reimbursementAmountCents: Math.round(values.reimbursementAmount * 100),
            reimbursementAccountId: values.reimbursementAccountId,
            reimbursementAt,
          }),
          sharedAmountCents,
          sharedReimbursementAccountId: sharedAmountCents ? values.sharedReimbursementAccountId : undefined,
        });
      } else {
        await createMovement.mutateAsync({
          type: values.type,
          amountCents: Math.round(values.amount * 100),
          accountId: values.accountId!,
          categoryId: values.categoryId,
          description: values.description || undefined,
          occurredAt,
          tagIds: values.tagIds?.length ? values.tagIds : undefined,
          sharedAmountCents,
          sharedReimbursementAccountId: sharedAmountCents ? values.sharedReimbursementAccountId : undefined,
        });
      }
      setOpen(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o && isDirty) { setConfirmDiscard(true); return; }
    if (!o) setServerError(null);
    setOpen(o);
  }

  return (
    <>
    <DiscardChangesAlert
      open={confirmDiscard}
      onConfirm={() => { setConfirmDiscard(false); setServerError(null); setOpen(false); }}
      onCancel={() => setConfirmDiscard(false)}
    />
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4 mr-1" />
            {label}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 flex flex-col max-h-[90dvh] overflow-hidden w-[calc(100vw-2rem)] sm:w-auto sm:max-w-2xl">
        <DialogHeader className="px-5 sm:px-6 py-4 border-b shrink-0">
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {serverError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 mb-4">
              {serverError}
            </p>
          )}
          <MovementForm
            onSubmit={handleSubmit}
            defaultValues={initialValues}
            formId="create-movement-form"
            onDirtyChange={setIsDirty}
          />
        </div>

        <div className="shrink-0 px-5 sm:px-6 py-4 border-t">
          <Button type="submit" form="create-movement-form" className="w-full" size="lg" disabled={createMovement.isPending || createPurchase.isPending}>
            {createMovement.isPending || createPurchase.isPending ? "Guardando..." : "Guardar movimiento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
