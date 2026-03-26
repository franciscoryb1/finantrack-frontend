"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MovementForm } from "./MovementForm";
import { DiscardChangesAlert } from "@/components/ui/discard-changes-alert";
import { useUpdateMovement } from "../hooks/useUpdateMovement";
import { registerMovementReimbursement } from "@/features/shared-expenses/api/shared-expenses.api";
import { MovementFormValues } from "../schemas/movement.schema";
import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";

type Props = {
  item: DashboardActivityItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditMovementDialog({ item, open, onOpenChange }: Props) {
  const updateMovement = useUpdateMovement();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const initialParentCategoryId = item.category?.parent
    ? item.category.parent.id
    : item.category?.id;

  const initialCategoryId = item.category?.id;

  const occurredAt = (item.purchaseDate ?? item.occurredAt).slice(0, 10);

  const defaultValues: Partial<MovementFormValues> = {
    type: item.type as "INCOME" | "EXPENSE",
    amount: item.amountCents / 100,
    description: item.description ?? "",
    categoryId: initialCategoryId,
    occurredAt,
    paymentMethod: "ACCOUNT",
    accountId: item.account?.id,
    tagIds: item.tags?.map((t) => t.id) ?? [],
    sharedExpenseEnabled: !!item.sharedExpense?.sharedAmountCents,
    sharedAmount: item.sharedExpense?.sharedAmountCents
      ? item.sharedExpense.sharedAmountCents / 100
      : undefined,
  };

  async function handleSubmit(values: MovementFormValues) {
    setServerError(null);
    const [y, m, d] = values.occurredAt.split("-").map(Number);
    const occurredAt = new Date(y, m - 1, d, 12, 0, 0).toISOString();

    try {
      const sharedAmountCents = values.sharedAmount ? Math.round(values.sharedAmount * 100) : undefined;
      await updateMovement.mutateAsync({
        id: item.id,
        data: {
          type: values.type,
          amountCents: Math.round(values.amount * 100),
          accountId: values.accountId!,
          categoryId: values.categoryId,
          description: values.description || undefined,
          occurredAt,
          tagIds: values.tagIds ?? [],
          sharedAmountCents: values.sharedExpenseEnabled ? sharedAmountCents : null,
        },
      });
      if (sharedAmountCents && values.sharedReimbursementAccountId) {
        await registerMovementReimbursement(item.id, {
          accountId: values.sharedReimbursementAccountId,
          amountCents: sharedAmountCents,
          occurredAt,
          description: values.description ? `Reintegro - ${values.description}` : "Reintegro",
        });
      }
      onOpenChange(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o && isDirty) { setConfirmDiscard(true); return; }
    if (!o) setServerError(null);
    onOpenChange(o);
  }

  return (
    <>
    <DiscardChangesAlert
      open={confirmDiscard}
      onConfirm={() => { setConfirmDiscard(false); setServerError(null); onOpenChange(false); }}
      onCancel={() => setConfirmDiscard(false)}
    />
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="p-0 gap-0 max-h-[92svh] sm:max-w-md">
        <DialogHeader className="px-5 pb-3.5 pt-5 border-b shrink-0">
          <DialogTitle>Editar movimiento</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {serverError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 mb-4">
              {serverError}
            </p>
          )}
          <MovementForm
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
            initialParentCategoryId={initialParentCategoryId}
            formId="edit-movement-form"
            onDirtyChange={setIsDirty}
            hidePaymentMethod
          />
        </div>

        <div className="shrink-0 px-5 pt-3 pb-4 border-t">
          <Button type="submit" form="edit-movement-form" className="w-full" disabled={updateMovement.isPending}>
            {updateMovement.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
