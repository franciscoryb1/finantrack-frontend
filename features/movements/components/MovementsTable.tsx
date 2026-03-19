"use client";

import { useState, useEffect } from "react";
import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";
import { formatCurrency } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Trash2, CreditCard, Repeat2, ArrowUp, ArrowDown, Users, RotateCcw, SlidersHorizontal } from "lucide-react";
import { TagBadge } from "@/features/tags/components/TagBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { EditMovementDialog } from "./EditMovementDialog";
import { EditBalanceAdjustmentDialog } from "./EditBalanceAdjustmentDialog";
import { EditTransferDialog } from "@/features/account-transfers/components/EditTransferDialog";
import { EditCreditCardPurchaseDialog } from "@/features/credit-card-purchases/components/EditCreditCardPurchaseDialog";
import { useDeleteMovement } from "../hooks/useDeleteMovement";
import { useDeleteTransfer } from "@/features/account-transfers/hooks/useDeleteTransfer";
import { SharedExpenseBadge } from "@/features/shared-expenses/components/SharedExpenseBadge";
import { RegisterReimbursementDialog } from "@/features/shared-expenses/components/RegisterReimbursementDialog";

const PAGE_SIZE = 10;

type ItemType = "INCOME" | "EXPENSE" | "STATEMENT_PAYMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "BALANCE_ADJUSTMENT";

function isTransfer(type: ItemType) {
  return type === "TRANSFER_OUT" || type === "TRANSFER_IN";
}

function isSystemGenerated(type: ItemType) {
  return type === "STATEMENT_PAYMENT";
}

function isBalanceAdjustment(type: ItemType) {
  return type === "BALANCE_ADJUSTMENT";
}

function getAmountColor(type: ItemType, balanceAdjIncreased?: boolean | null) {
  if (type === "INCOME") return "text-green-700 dark:text-green-400";
  if (type === "TRANSFER_OUT" || type === "TRANSFER_IN" || type === "STATEMENT_PAYMENT")
    return "text-blue-700 dark:text-blue-400";
  if (type === "BALANCE_ADJUSTMENT")
    return balanceAdjIncreased
      ? "text-green-700 dark:text-green-400"
      : "text-red-700 dark:text-red-400";
  return "text-red-700 dark:text-red-400";
}

function getBarColor(type: ItemType, balanceAdjIncreased?: boolean | null) {
  if (type === "INCOME") return "bg-green-500";
  if (type === "TRANSFER_OUT" || type === "TRANSFER_IN" || type === "STATEMENT_PAYMENT")
    return "bg-blue-400";
  if (type === "BALANCE_ADJUSTMENT") return balanceAdjIncreased ? "bg-green-500" : "bg-red-500";
  return "bg-red-500";
}

function getAmountPrefix(type: ItemType, balanceAdjIncreased?: boolean | null) {
  if (type === "INCOME" || type === "TRANSFER_IN") return "+";
  if (type === "BALANCE_ADJUSTMENT") return balanceAdjIncreased ? "+" : "-";
  return "-";
}

function SystemIcon({ type }: { type: ItemType }) {
  if (type === "STATEMENT_PAYMENT")
    return <CreditCard className="h-4 w-4 text-blue-400" />;
  if (type === "BALANCE_ADJUSTMENT")
    return <SlidersHorizontal className="h-4 w-4 text-violet-400" />;
  return null;
}

function IncomeSourceBadge({ source }: { source: "PURCHASE_REIMBURSEMENT" | "SHARED_REIMBURSEMENT" }) {
  if (source === "PURCHASE_REIMBURSEMENT") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
        <RotateCcw className="h-2.5 w-2.5" />
        Reintegro promo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 shrink-0">
      <Users className="h-2.5 w-2.5" />
      Gasto compartido
    </span>
  );
}

type Props = {
  items: DashboardActivityItem[];
  loading?: boolean;
};

function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
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

function ItemSource({ item }: { item: DashboardActivityItem }) {
  if (item.kind === "CREDIT_CARD_INSTALLMENT" && item.creditCard) {
    return (
      <span className="text-muted-foreground">
        {item.creditCard.name} ···· {item.creditCard.cardLast4}
      </span>
    );
  }
  if (item.account) {
    return <span className="text-muted-foreground">{item.account.name}</span>;
  }
  return null;
}

export function MovementsTable({ items, loading }: Props) {
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [editItem, setEditItem] = useState<DashboardActivityItem | null>(null);
  const [editBalanceAdjItem, setEditBalanceAdjItem] = useState<DashboardActivityItem | null>(null);
  const [editTransferItem, setEditTransferItem] = useState<DashboardActivityItem | null>(null);
  const [editPurchaseItem, setEditPurchaseItem] = useState<DashboardActivityItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<DashboardActivityItem | null>(null);
  const [deleteTransferItem, setDeleteTransferItem] = useState<DashboardActivityItem | null>(null);
  type SharedExpenseInfo = { sharedAmountCents: number; receivedAmountCents: number; pendingAmountCents: number };
  const [reimbursementTarget, setReimbursementTarget] = useState<{
    kind: "movement" | "purchase";
    sourceId: number;
    info: SharedExpenseInfo;
    description: string | null;
  } | null>(null);
  const deleteMovement = useDeleteMovement();
  const deleteTransfer = useDeleteTransfer();

  function handleRowClick(item: DashboardActivityItem) {
    if (item.kind === "CREDIT_CARD_INSTALLMENT" && item.installmentInfo?.purchaseId) {
      setEditPurchaseItem(item);
      return;
    }
    if (item.kind !== "MOVEMENT") return;
    const type = item.type as ItemType;
    if (isTransfer(type) && item.transferData) {
      setEditTransferItem(item);
    } else if (isBalanceAdjustment(type)) {
      setEditBalanceAdjItem(item);
    } else if (!isSystemGenerated(type) && !isTransfer(type)) {
      setEditItem(item);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [items, sortOrder]);

  function toggleSort() {
    setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
  }

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
        No hay actividad en este período.
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(a.purchaseDate ?? a.occurredAt).getTime();
    const dateB = new Date(b.purchaseDate ?? b.occurredAt).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  const totalPages = Math.ceil(sortedItems.length / PAGE_SIZE);
  const paginated = sortedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-3">
      <div className="rounded-lg border overflow-hidden">

        {/* ── Vista mobile ── */}
        <div className="md:hidden divide-y">
          <div className="flex items-center justify-end px-4 py-2 border-b bg-muted/50">
            <button
              onClick={toggleSort}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Fecha
              {sortOrder === "desc" ? (
                <ArrowDown className="h-3.5 w-3.5" />
              ) : (
                <ArrowUp className="h-3.5 w-3.5" />
              )}
            </button>
          </div>
          {paginated.map((item) => {
            const type = item.type as ItemType;
            const isClickable =
              (item.kind === "CREDIT_CARD_INSTALLMENT" && !!item.installmentInfo?.purchaseId) ||
              (item.kind === "MOVEMENT" && (
                (!isSystemGenerated(type) && !isTransfer(type)) ||
                (isTransfer(type) && !!item.transferData)
              ));
            return (
            <div
              key={`${item.kind}-${item.id}`}
              className={cn("flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors", isClickable && "cursor-pointer")}
              onClick={() => isClickable && handleRowClick(item)}
            >
              <div className={cn("w-1 self-stretch rounded-full shrink-0", getBarColor(item.type as ItemType, item.balanceAdjustmentIncreased))} />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm leading-snug truncate flex items-center gap-1.5">
                  {item.description ?? (
                    <span className="italic text-muted-foreground">Sin descripción</span>
                  )}
                  {item.isRecurring && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Repeat2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top">Pago de gasto fijo</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </p>
                {item.incomeSource && (
                  <IncomeSourceBadge source={item.incomeSource} />
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 flex-wrap">
                  <ItemSource item={item} />
                  {item.installmentInfo && (
                    <>
                      <span>·</span>
                      <span>Cuota {item.installmentInfo.installmentNumber}/{item.installmentInfo.installmentsCount}</span>
                    </>
                  )}
                  {item.installmentInfo?.reimbursementAmountCents && (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      · Reintegro +{formatCurrency(item.installmentInfo.reimbursementAmountCents)}
                    </span>
                  )}
                  {item.category && (
                    <>
                      <span>·</span>
                      <CategoryBadge category={item.category} className="text-[10px] h-4 px-1.5" />
                    </>
                  )}
                  {item.tags?.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} />
                  ))}
                </div>
                {item.sharedExpense && (
                  <SharedExpenseBadge
                    info={item.sharedExpense}
                    onRegister={item.sharedExpense.pendingAmountCents > 0 ? () => setReimbursementTarget({
                      kind: item.kind === "CREDIT_CARD_INSTALLMENT" ? "purchase" : "movement",
                      sourceId: item.kind === "CREDIT_CARD_INSTALLMENT" ? (item.installmentInfo?.purchaseId ?? item.id) : item.id,
                      info: item.sharedExpense!,
                      description: item.description,
                    }) : undefined}
                  />
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <p className={cn("font-semibold tabular-nums text-sm", getAmountColor(item.type as ItemType, item.balanceAdjustmentIncreased))}>
                    {getAmountPrefix(item.type as ItemType, item.balanceAdjustmentIncreased)}{formatCurrency(item.amountCents)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(item.purchaseDate ?? item.occurredAt)}
                  </p>
                </div>

                {item.kind === "MOVEMENT" && isTransfer(item.type as ItemType) && item.transferData && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTransferItem(item)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTransferItem(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                {item.kind === "MOVEMENT" && !isSystemGenerated(item.type as ItemType) && !isTransfer(item.type as ItemType) && (
                  <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            isBalanceAdjustment(item.type as ItemType)
                              ? setEditBalanceAdjItem(item)
                              : setEditItem(item)
                          }
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
                {item.kind === "MOVEMENT" && isSystemGenerated(item.type as ItemType) && (
                  <div className="h-7 w-7 shrink-0 flex items-center justify-center">
                    <SystemIcon type={item.type as ItemType} />
                  </div>
                )}
              </div>
            </div>
          );
          })}
        </div>

        {/* ── Vista desktop ── */}
        <table className="hidden md:table w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                <button
                  onClick={toggleSort}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  Fecha
                  {sortOrder === "desc" ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUp className="h-3.5 w-3.5" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoría</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Origen</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {paginated.map((item) => {
              const type = item.type as ItemType;
              const isClickable =
                (item.kind === "CREDIT_CARD_INSTALLMENT" && !!item.installmentInfo?.purchaseId) ||
                (item.kind === "MOVEMENT" && (
                  (!isSystemGenerated(type) && !isTransfer(type)) ||
                  (isTransfer(type) && !!item.transferData)
                ));
              return (
              <tr
                key={`${item.kind}-${item.id}`}
                className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", isClickable && "cursor-pointer")}
                onClick={() => isClickable && handleRowClick(item)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium">{formatDate(item.purchaseDate ?? item.occurredAt)}</div>
                  <div className="text-xs text-muted-foreground/70 mt-0.5">
                    reg. {formatDate(item.registeredAt)}
                  </div>
                </td>

                <td className="px-4 py-3">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium flex items-center gap-1.5">
                      {item.description ?? (
                        <span className="text-muted-foreground italic">Sin descripción</span>
                      )}
                      {item.isRecurring && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Repeat2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="top">Pago de gasto fijo</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {item.incomeSource && (
                        <IncomeSourceBadge source={item.incomeSource} />
                      )}
                    </span>
                    {item.installmentInfo && (
                      <span className="text-xs text-muted-foreground">
                        Cuota {item.installmentInfo.installmentNumber}/{item.installmentInfo.installmentsCount}
                        {item.installmentInfo.reimbursementAmountCents && (
                          <span className="ml-1 text-green-600 dark:text-green-400 font-medium">
                            · Reintegro +{formatCurrency(item.installmentInfo.reimbursementAmountCents)}
                          </span>
                        )}
                      </span>
                    )}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.tags.map((tag) => (
                          <TagBadge key={tag.id} tag={tag} />
                        ))}
                      </div>
                    )}
                    {item.sharedExpense && (
                      <SharedExpenseBadge
                        info={item.sharedExpense}
                        onRegister={item.sharedExpense.pendingAmountCents > 0 ? () => setReimbursementTarget({
                          kind: item.kind === "CREDIT_CARD_INSTALLMENT" ? "purchase" : "movement",
                          sourceId: item.kind === "CREDIT_CARD_INSTALLMENT" ? (item.installmentInfo?.purchaseId ?? item.id) : item.id,
                          info: item.sharedExpense!,
                          description: item.description,
                        }) : undefined}
                      />
                    )}
                  </div>
                </td>

                <td className="px-4 py-3">
                  {item.category ? (
                    <CategoryBadge category={item.category} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                <td className="px-4 py-3">
                  <ItemSource item={item} />
                </td>

                <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", getAmountColor(item.type as ItemType, item.balanceAdjustmentIncreased))}>
                  {getAmountPrefix(item.type as ItemType, item.balanceAdjustmentIncreased)}{formatCurrency(item.amountCents)}
                </td>

                <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                  {item.kind === "MOVEMENT" && isTransfer(item.type as ItemType) && item.transferData && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTransferItem(item)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTransferItem(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {item.kind === "MOVEMENT" && !isSystemGenerated(item.type as ItemType) && !isTransfer(item.type as ItemType) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            isBalanceAdjustment(item.type as ItemType)
                              ? setEditBalanceAdjItem(item)
                              : setEditItem(item)
                          }
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteItem(item)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {item.kind === "MOVEMENT" && isSystemGenerated(item.type as ItemType) && (
                    <div className="h-7 w-7 flex items-center justify-center">
                      <SystemIcon type={item.type as ItemType} />
                    </div>
                  )}
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Diálogo editar movimiento ── */}
      {editItem && (
        <EditMovementDialog
          item={editItem}
          open={!!editItem}
          onOpenChange={(open) => { if (!open) setEditItem(null); }}
        />
      )}

      {/* ── Diálogo editar ajuste de saldo ── */}
      {editBalanceAdjItem && (
        <EditBalanceAdjustmentDialog
          item={editBalanceAdjItem}
          open={!!editBalanceAdjItem}
          onOpenChange={(open) => { if (!open) setEditBalanceAdjItem(null); }}
        />
      )}

      {/* ── Diálogo editar transferencia ── */}
      {editTransferItem && (
        <EditTransferDialog
          item={editTransferItem}
          open={!!editTransferItem}
          onOpenChange={(open) => { if (!open) setEditTransferItem(null); }}
        />
      )}

      {/* ── Diálogo editar compra en cuotas ── */}
      {editPurchaseItem && (
        <EditCreditCardPurchaseDialog
          item={editPurchaseItem}
          open={!!editPurchaseItem}
          onOpenChange={(open) => { if (!open) setEditPurchaseItem(null); }}
        />
      )}

      {/* ── Diálogo confirmar eliminar transferencia ── */}
      <AlertDialog open={!!deleteTransferItem} onOpenChange={(open) => { if (!open) setDeleteTransferItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar transferencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán los dos movimientos asociados y se revertirán los saldos de ambas cuentas. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTransferItem?.transferData) {
                  await deleteTransfer.mutateAsync(deleteTransferItem.transferData.id);
                  setDeleteTransferItem(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Diálogo confirmar eliminar ── */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteItem?.type === "BALANCE_ADJUSTMENT"
                ? "¿Eliminar ajuste de saldo?"
                : "¿Eliminar movimiento?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteItem?.type === "BALANCE_ADJUSTMENT"
                ? "El registro del ajuste será eliminado del historial. El saldo actual de la cuenta no se verá afectado."
                : <>
                    {deleteItem?.description
                      ? `"${deleteItem.description}"`
                      : "Este movimiento"}{" "}
                    será eliminado permanentemente. Esta acción no se puede deshacer.
                  </>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteItem) {
                  await deleteMovement.mutateAsync(deleteItem.id);
                  setDeleteItem(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Diálogo registrar reintegro gasto compartido ── */}
      {reimbursementTarget && (
        <RegisterReimbursementDialog
          open={!!reimbursementTarget}
          onOpenChange={(open) => { if (!open) setReimbursementTarget(null); }}
          kind={reimbursementTarget.kind}
          sourceId={reimbursementTarget.sourceId}
          sharedAmountCents={reimbursementTarget.info.sharedAmountCents}
          receivedAmountCents={reimbursementTarget.info.receivedAmountCents}
          pendingAmountCents={reimbursementTarget.info.pendingAmountCents}
          expenseDescription={reimbursementTarget.description}
        />
      )}

      {/* ── Paginación ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sortedItems.length)} de {sortedItems.length}
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
