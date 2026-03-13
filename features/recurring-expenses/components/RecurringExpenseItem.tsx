"use client";

import { useState } from "react";
import { RecurringExpense } from "../api/recurring-expenses.api";
import { EditRecurringExpenseDialog } from "./EditRecurringExpenseDialog";
import { useDeleteRecurringExpense } from "../hooks/useDeleteRecurringExpense";
import { formatCurrency } from "@/lib/utils";
import { FREQUENCY_LABELS, DAY_OF_WEEK_LABEL } from "../schemas/recurring-expense.schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = {
  expense: RecurringExpense;
};

export function RecurringExpenseItem({ expense }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const deleteExpense = useDeleteRecurringExpense();

  const nextDue = getNextDueLabel(expense);

  return (
    <>
      <div className="flex items-start justify-between gap-3 p-4 rounded-lg border bg-card">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold">{expense.name}</p>
            <Badge variant="secondary" className="text-xs">
              {FREQUENCY_LABELS[expense.frequency]}
              {expense.dueDay && ` · día ${expense.dueDay}`}
              {expense.dueDayOfWeek != null && ` · ${DAY_OF_WEEK_LABEL[expense.dueDayOfWeek]}`}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatCurrency(expense.amountCents)}
            {expense.category && <> · {expense.category.name}</>}
          </p>
          {nextDue && (
            <p className="text-xs text-muted-foreground">{nextDue}</p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <EditRecurringExpenseDialog expense={expense} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirmOpen(true)}
            title="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar gasto fijo?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{expense.name}&quot; será eliminado permanentemente junto con su historial de pagos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteExpense.mutate(expense.id)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getNextDueLabel(expense: RecurringExpense): string | null {
  const now = new Date();
  const start = new Date(expense.startDate);

  let current: Date;

  if (expense.frequency === "MONTHLY" && expense.dueDay) {
    // Find next occurrence using dueDay, on or after startDate and after today
    const base = start > now ? start : now;
    const candidate = new Date(base.getFullYear(), base.getMonth(), expense.dueDay, 12, 0, 0);
    if (candidate < start || candidate <= now) {
      current = new Date(base.getFullYear(), base.getMonth() + 1, expense.dueDay, 12, 0, 0);
    } else {
      current = candidate;
    }
  } else if (start > now) {
    current = start;
  } else {
    // Iterate from startDate until past today
    current = new Date(start);
    while (current <= now) {
      if (expense.frequency === "WEEKLY") {
        current = new Date(current.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (expense.frequency === "BIWEEKLY") {
        current = new Date(current.getTime() + 14 * 24 * 60 * 60 * 1000);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }
  }

  if (expense.endDate && current > new Date(expense.endDate)) {
    return "Gasto finalizado";
  }

  return `Próximo: ${current.toLocaleDateString("es-AR")}`;
}
