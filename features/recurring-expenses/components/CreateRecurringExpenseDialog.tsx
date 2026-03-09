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

export function CreateRecurringExpenseDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setServerError(null); setOpen(o); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo gasto fijo
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo gasto fijo</DialogTitle>
        </DialogHeader>

        {serverError && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            {serverError}
          </p>
        )}

        <RecurringExpenseForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
