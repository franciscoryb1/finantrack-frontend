"use client";

import { RecurringOccurrence } from "../api/recurring-expenses.api";
import { PayOccurrenceDialog } from "./PayOccurrenceDialog";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

type Props = {
  occurrence: RecurringOccurrence;
  compact?: boolean; // para el dashboard (sin borde y más compacto)
};

export function OccurrenceRow({ occurrence, compact = false }: Props) {
  const { status, recurringExpense, dueDate, payment } = occurrence;

  const dueDateObj = new Date(dueDate);
  const dueDateStr = dueDateObj.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
  });

  const isPending = status === "PENDING";
  const isOverdue = status === "OVERDUE";
  const isPaid = status === "PAID";

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3",
        compact ? "py-2.5" : "py-3 border-b last:border-0",
        isOverdue && !compact && "bg-red-50/50 dark:bg-red-950/20 -mx-4 px-4",
      )}
    >
      {/* Ícono + info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {isPaid && (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
        )}
        {isPending && (
          <Clock className="h-4 w-4 shrink-0 text-amber-500" />
        )}
        {isOverdue && (
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
        )}

        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium truncate",
              isPaid && "text-muted-foreground",
            )}
          >
            {recurringExpense.name}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isOverdue ? (
              <span className="text-red-500 font-medium">Vencido el {dueDateStr}</span>
            ) : (
              <span>Vence el {dueDateStr}</span>
            )}
            {recurringExpense.category && (
              <> · {recurringExpense.category.name}</>
            )}
            {isPaid && payment?.accountName && (
              <> · desde {payment.accountName}</>
            )}
          </p>
        </div>
      </div>

      {/* Monto + acción */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "text-sm tabular-nums",
            isPaid ? "text-muted-foreground font-normal" : "font-semibold",
            isOverdue && "text-red-600",
          )}
        >
          {isPaid && payment
            ? formatCurrency(payment.amountCents)
            : formatCurrency(recurringExpense.amountCents)}
        </span>

        {isPaid ? (
          <span className="text-xs font-medium text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 dark:bg-green-950/30 dark:border-green-800">
            Pagado
          </span>
        ) : (
          <PayOccurrenceDialog
            occurrence={occurrence}
            trigger={
              <button
                className={cn(
                  "text-xs font-semibold rounded-full px-3 py-1 transition-colors",
                  isOverdue
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                Registrar pago
              </button>
            }
          />
        )}
      </div>
    </div>
  );
}
