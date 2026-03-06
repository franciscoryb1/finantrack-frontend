"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MovementForm } from "./MovementForm";
import { useUpdateMovement } from "../hooks/useUpdateMovement";
import { MovementFormValues } from "../schemas/movement.schema";
import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";

type Props = {
  item: DashboardActivityItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditMovementDialog({ item, open, onOpenChange }: Props) {
  const updateMovement = useUpdateMovement();

  // Determinar parentCategoryId e initialCategoryId desde el item
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
  };

  async function handleSubmit(values: MovementFormValues) {
    const [y, m, d] = values.occurredAt.split("-").map(Number);
    const occurredAt = new Date(y, m - 1, d, 12, 0, 0).toISOString();

    await updateMovement.mutateAsync({
      id: item.id,
      data: {
        type: values.type,
        amountCents: Math.round(values.amount * 100),
        accountId: values.accountId!,
        categoryId: values.categoryId,
        description: values.description || undefined,
        occurredAt,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar movimiento</DialogTitle>
        </DialogHeader>

        <MovementForm
          onSubmit={handleSubmit}
          defaultValues={defaultValues}
          initialParentCategoryId={initialParentCategoryId}
          submitLabel="Guardar cambios"
        />
      </DialogContent>
    </Dialog>
  );
}
