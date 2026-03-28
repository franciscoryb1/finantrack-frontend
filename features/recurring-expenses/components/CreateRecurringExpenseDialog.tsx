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
import { RecurringExpenseForm } from "./RecurringExpenseForm";
import { useCreateRecurringExpense } from "../hooks/useCreateRecurringExpense";
import { RecurringExpenseFormValues } from "../schemas/recurring-expense.schema";
import { DiscardChangesAlert } from "@/components/ui/discard-changes-alert";

export function CreateRecurringExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const create = useCreateRecurringExpense();

  async function handleSubmit(values: RecurringExpenseFormValues) {
    setServerError(null);
    const [sy, sm, sd] = values.startDate.split("-").map(Number);
    const startDate = new Date(sy, sm - 1, sd, 12, 0, 0).toISOString();

    let endDate: string | undefined;
    if (values.endDate) {
      const [ey, em, ed] = values.endDate.split("-").map(Number);
      endDate = new Date(ey, em - 1, ed, 12, 0, 0).toISOString();
    }

    try {
      await create.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        amountCents: Math.round(values.amount * 100),
        frequency: values.frequency,
        dueDay: values.dueDay,
        dueDayOfWeek: values.dueDayOfWeek,
        startDate,
        endDate,
        categoryId: values.categoryId,
      });
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
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo gasto fijo
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 sm:max-w-lg flex flex-col max-h-[90dvh] w-[calc(100vw-2rem)] sm:w-auto">
        <DialogHeader className="px-6 pb-4 border-b shrink-0">
          <DialogTitle>Nuevo gasto fijo</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {serverError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 mb-4">
              {serverError}
            </p>
          )}
          <RecurringExpenseForm onSubmit={handleSubmit} formId="create-recurring-form" onDirtyChange={setIsDirty} />
        </div>

        <div className="shrink-0 px-6 pt-3 pb-5 border-t">
          <Button type="submit" form="create-recurring-form" className="w-full" disabled={create.isPending}>
            {create.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
