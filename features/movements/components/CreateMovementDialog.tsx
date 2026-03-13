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
import { cn } from "@/lib/utils";
import { MovementForm } from "./MovementForm";
import { useCreateMovement } from "../hooks/useCreateMovement";
import { useCreateCreditCardPurchase } from "@/features/credit-card-purchases/hooks/useCreateCreditCardPurchase";
import { MovementFormValues } from "../schemas/movement.schema";

type Props = {
  initialValues?: Partial<MovementFormValues>;
  label?: string;
};

export function CreateMovementDialog({ initialValues, label = "Nuevo movimiento" }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [reimbursementOpen, setReimbursementOpen] = useState(false);
  const createMovement = useCreateMovement();
  const createPurchase = useCreateCreditCardPurchase();

  async function handleSubmit(values: MovementFormValues) {
    setServerError(null);
    const [y, m, d] = values.occurredAt.split("-").map(Number);
    const occurredAt = new Date(y, m - 1, d, 12, 0, 0).toISOString();

    try {
      if (values.paymentMethod === "CREDIT_CARD") {
        let reimbursementAt: string | undefined;
        if (values.reimbursementEnabled && values.reimbursementAt) {
          const [ry, rm, rd] = values.reimbursementAt.split("-").map(Number);
          reimbursementAt = new Date(ry, rm - 1, rd, 12, 0, 0).toISOString();
        }
        await createPurchase.mutateAsync({
          creditCardId: values.creditCardId!,
          totalAmountCents: Math.round(values.amount * 100),
          installmentsCount: values.installmentsCount!,
          categoryId: values.categoryId,
          description: values.description || undefined,
          occurredAt,
          ...(values.reimbursementEnabled && values.reimbursementAmount && values.reimbursementAccountId && {
            reimbursementAmountCents: Math.round(values.reimbursementAmount * 100),
            reimbursementAccountId: values.reimbursementAccountId,
            reimbursementAt,
          }),
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
        });
      }
      setOpen(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setServerError(null); setReimbursementOpen(false); } setOpen(o); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          {label}
        </Button>
      </DialogTrigger>

      <DialogContent className={cn(
        "max-h-[90vh] overflow-y-auto sm:overflow-visible sm:max-h-none",
        reimbursementOpen ? "sm:max-w-2xl" : "sm:max-w-lg"
      )}>
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
        </DialogHeader>

        {serverError && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            {serverError}
          </p>
        )}

        <MovementForm
          onSubmit={handleSubmit}
          defaultValues={initialValues}
          onReimbursementChange={setReimbursementOpen}
        />
      </DialogContent>
    </Dialog>
  );
}
