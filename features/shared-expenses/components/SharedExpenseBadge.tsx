"use client";

import { Users, CheckCircle2 } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

type SharedExpenseInfo = {
  sharedAmountCents: number;
  receivedAmountCents: number;
  pendingAmountCents: number;
};

type Props = {
  info: SharedExpenseInfo;
  className?: string;
};

export function SharedExpenseBadge({ info, className }: Props) {
  const isFullyReceived = info.pendingAmountCents <= 0;

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border",
          isFullyReceived
            ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
            : "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400"
        )}
      >
        {isFullyReceived ? (
          <CheckCircle2 className="h-2.5 w-2.5" />
        ) : (
          <Users className="h-2.5 w-2.5" />
        )}
        Compartido
      </span>
      {isFullyReceived ? (
        <span className="text-[10px] text-green-600 dark:text-green-400 tabular-nums">
          cobrado {formatCurrency(info.receivedAmountCents)}
        </span>
      ) : (
        <span className="text-[10px] text-amber-600 dark:text-amber-400 tabular-nums">
          pendiente {formatCurrency(info.pendingAmountCents)}
        </span>
      )}
    </div>
  );
}
