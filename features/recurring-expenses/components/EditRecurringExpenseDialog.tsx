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
import { Pencil } from "lucide-react";
import { RecurringExpenseForm } from "./RecurringExpenseForm";
import { useUpdateRecurringExpense } from "../hooks/useUpdateRecurringExpense";
import { RecurringExpense } from "../api/recurring-expenses.api";
import { RecurringExpenseFormValues } from "../schemas/recurring-expense.schema";
import { DiscardChangesAlert } from "@/components/ui/discard-changes-alert";

type Props = {
  expense: RecurringExpense;
};

export function EditRecurringExpenseDialog({ expense }: Props) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const update = useUpdateRecurringExpense();

  const initialParentCategoryId = expense.category?.parent
    ? expense.category.parent.id
    : expense.category?.id;

  async function handleSubmit(values: RecurringExpenseFormValues) {
    setServerError(null);
    try {
      await update.mutateAsync({
        id: expense.id,
        data: {
          name: values.name,
          description: values.description,
          amountCents: Math.round(values.amount * 100),
          dueDay: values.dueDay,
          dueDayOfWeek: values.dueDayOfWeek,
          categoryId: values.categoryId,
        },
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
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 gap-0 sm:max-w-lg max-h-[90vh]">
        <DialogHeader className="px-6 pb-4 border-b shrink-0">
          <DialogTitle>Editar gasto recurrente</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {serverError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 mb-4">
              {serverError}
            </p>
          )}
          {open && <RecurringExpenseForm
            onSubmit={handleSubmit}
            formId="edit-recurring-form"
            onDirtyChange={setIsDirty}
            initialParentCategoryId={initialParentCategoryId}
            defaultValues={{
              name: expense.name,
              description: expense.description ?? "",
              amount: expense.amountCents / 100,
              frequency: expense.frequency,
              dueDay: expense.dueDay ?? undefined,
              dueDayOfWeek: expense.dueDayOfWeek ?? undefined,
              startDate: expense.startDate.split("T")[0],
              endDate: expense.endDate ? expense.endDate.split("T")[0] : "",
              categoryId: expense.categoryId ?? undefined,
            }}
          />}
        </div>

        <div className="shrink-0 px-6 pt-3 pb-5 border-t">
          <Button type="submit" form="edit-recurring-form" className="w-full" disabled={update.isPending}>
            {update.isPending ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
