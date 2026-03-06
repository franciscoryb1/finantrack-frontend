"use client";

import { useState, useEffect } from "react";
import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type Props = {
  items: DashboardActivityItem[];
  loading?: boolean;
};

function formatDate(iso: string, includeYear = true) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    ...(includeYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });
}

function getPaginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | "…")[] = [1];
  if (current > 3) range.push("…");
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) range.push(i);
  if (current < total - 2) range.push("…");
  range.push(total);
  return range;
}

export function InstallmentsTable({ items, loading }: Props) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [items]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No hay cuotas en este período.
      </div>
    );
  }

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginated = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">

        {/* ── Vista mobile ── */}
        <div className="md:hidden divide-y">
          {paginated.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="w-1 self-stretch rounded-full shrink-0 bg-red-500" />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug truncate">
                  {item.description ?? (
                    <span className="italic text-muted-foreground">Sin descripción</span>
                  )}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  {item.creditCard && (
                    <span>{item.creditCard.name} ···· {item.creditCard.cardLast4}</span>
                  )}
                  {item.installmentInfo && (
                    <>
                      <span>·</span>
                      <span>
                        Cuota {item.installmentInfo.installmentNumber}/{item.installmentInfo.installmentsCount}
                      </span>
                    </>
                  )}
                  {item.category && (
                    <>
                      <span>·</span>
                      <span>
                        {item.category.parent
                          ? `${item.category.parent.name} › ${item.category.name}`
                          : item.category.name}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-semibold tabular-nums text-sm text-red-700 dark:text-red-400">
                  -{formatCurrency(item.amountCents)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(item.purchaseDate ?? item.occurredAt)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                  reg. {formatDate(item.registeredAt)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Vista desktop ── */}
        <table className="hidden md:table w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tarjeta</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoría</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((item) => (
              <tr
                key={`${item.kind}-${item.id}`}
                className="border-b last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium">{formatDate(item.purchaseDate ?? item.occurredAt)}</div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    reg. {formatDate(item.registeredAt)}
                  </div>
                </td>

                <td className="px-4 py-3 whitespace-nowrap">
                  {item.creditCard ? (
                    <span className="text-muted-foreground">
                      {item.creditCard.name} ···· {item.creditCard.cardLast4}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  {item.category ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="secondary">
                        {item.category.parent ? item.category.parent.name : item.category.name}
                      </Badge>
                      {item.category.parent && (
                        <Badge variant="secondary">{item.category.name}</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {item.description ?? (
                        <span className="text-muted-foreground italic">Sin descripción</span>
                      )}
                    </span>
                    {item.installmentInfo && (
                      <span className="text-xs text-muted-foreground">
                        Cuota {item.installmentInfo.installmentNumber}/{item.installmentInfo.installmentsCount}
                      </span>
                    )}
                  </div>
                </td>

                <td className={cn(
                  "px-4 py-3 text-right font-semibold tabular-nums",
                  "text-red-700 dark:text-red-400",
                )}>
                  -{formatCurrency(item.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, items.length)} de {items.length}
          </span>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage((p) => p - 1)}
                  disabled={page === 1}
                  className="h-8 w-8"
                >
                  ‹
                </Button>
              </PaginationItem>

              {getPaginationRange(page, totalPages).map((item, i) =>
                item === "…" ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <Button
                      variant={page === item ? "outline" : "ghost"}
                      size="icon"
                      onClick={() => setPage(item)}
                      className="h-8 w-8 text-sm"
                    >
                      {item}
                    </Button>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page === totalPages}
                  className="h-8 w-8"
                >
                  ›
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
