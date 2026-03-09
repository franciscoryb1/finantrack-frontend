"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecurringExpenses } from "@/features/recurring-expenses/hooks/useRecurringExpenses";
import { useRecurringExpenseOccurrences } from "@/features/recurring-expenses/hooks/useRecurringExpenseOccurrences";
import { CreateRecurringExpenseDialog } from "@/features/recurring-expenses/components/CreateRecurringExpenseDialog";
import { RecurringExpenseItem } from "@/features/recurring-expenses/components/RecurringExpenseItem";
import { OccurrenceRow } from "@/features/recurring-expenses/components/OccurrenceRow";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function RecurringExpensesPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const isCurrentPeriod = year === now.getFullYear() && month === now.getMonth() + 1;

  const { data: expenses, isLoading: loadingExpenses } = useRecurringExpenses();
  const { data: occurrences, isLoading: loadingOccurrences } = useRecurringExpenseOccurrences(year, month);

  const overdue = (occurrences ?? []).filter((o) => o.status === "OVERDUE");
  const pending = (occurrences ?? []).filter((o) => o.status === "PENDING");
  const paid = (occurrences ?? []).filter((o) => o.status === "PAID");
  const pendingCount = overdue.length + pending.length;
  const sortedOccurrences = [...overdue, ...pending, ...paid];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gastos fijos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Alquiler, servicios y otros gastos periódicos
          </p>
        </div>
        <CreateRecurringExpenseDialog />
      </div>

      {/* Vencimientos del período */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-muted-foreground w-32 text-center">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isCurrentPeriod && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs ml-1"
                  onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
                >
                  Hoy
                </Button>
              )}
            </div>

            {!loadingOccurrences && (occurrences ?? []).length > 0 && (
              <span
                className={
                  pendingCount > 0
                    ? "text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }
              >
                {pendingCount > 0
                  ? `${pendingCount} pendiente${pendingCount > 1 ? "s" : ""} · ${paid.length} pagado${paid.length !== 1 ? "s" : ""}`
                  : `Todo al día · ${paid.length} pagado${paid.length !== 1 ? "s" : ""}`}
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card px-4">
          {loadingOccurrences ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : sortedOccurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay gastos fijos configurados para este período
            </p>
          ) : (
            <div>
              {sortedOccurrences.map((occ, i) => (
                <OccurrenceRow
                  key={`${occ.recurringExpense.id}-${occ.dueDate}-${i}`}
                  occurrence={occ}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Gastos configurados */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">
          Gastos configurados
          {(expenses ?? []).length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({(expenses ?? []).length})
            </span>
          )}
        </h2>

        {loadingExpenses ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-lg border bg-muted animate-pulse" />
            ))}
          </div>
        ) : (expenses ?? []).length === 0 ? (
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No hay gastos fijos configurados.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Creá uno con el botón &quot;Nuevo gasto fijo&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(expenses ?? []).map((e) => (
              <RecurringExpenseItem key={e.id} expense={e} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
