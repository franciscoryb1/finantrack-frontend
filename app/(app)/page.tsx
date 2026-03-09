"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, CreditCard, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/features/movements/components/KpiCard";
import { MovementsTable } from "@/features/movements/components/MovementsTable";
import { InstallmentsTable } from "@/features/movements/components/InstallmentsTable";
import { CreateMovementDialog } from "@/features/movements/components/CreateMovementDialog";
import { ImportLegacyPurchaseDialog } from "@/features/credit-card-purchases/components/ImportLegacyPurchaseDialog";
import { CreateTransferDialog } from "@/features/account-transfers/components/CreateTransferDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMovementsSummary } from "@/features/movements/hooks/useMovementsSummary";
import { useDashboardActivity } from "@/features/dashboard/hooks/useDashboardActivity";
import { useInstallmentsOverview } from "@/features/installments/hooks/useInstallmentsOverview";
import { CategorySpendCard } from "@/features/dashboard/components/CategorySpendCard";
import { useRecurringExpenseOccurrences } from "@/features/recurring-expenses/hooks/useRecurringExpenseOccurrences";
import { OccurrenceRow } from "@/features/recurring-expenses/components/OccurrenceRow";
import Link from "next/link";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function getPeriodDates(year: number, month: number) {
  return {
    fromDate: new Date(Date.UTC(year, month - 1, 1)).toISOString(),
    toDate: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString(),
  };
}

export default function DashboardPage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const isCurrentPeriod = year === currentYear && month === currentMonth;

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const { fromDate, toDate } = getPeriodDates(year, month);

  const { data: summary, isLoading: loadingSummary } = useMovementsSummary({ fromDate, toDate });
  const { data: activity, isLoading: loadingActivity } = useDashboardActivity(year, month);
  const { data: installmentsOverview } = useInstallmentsOverview();
  const { data: recurringOccurrences, isLoading: loadingRecurring } = useRecurringExpenseOccurrences(year, month);

  const TRACKED_CATEGORIES = ["Salidas", "Casa", "Transporte", "Supermercado"];

  const categorySpending = useMemo(() => {
    const spending = new Map<string, { totalCents: number; subcategories: Map<string, number> }>();

    for (const item of activity?.items ?? []) {
      if (item.type !== "EXPENSE" || !item.category) continue;

      const rootName = item.category.parent?.name ?? item.category.name;
      const subName = item.category.parent ? item.category.name : null;

      if (!spending.has(rootName)) {
        spending.set(rootName, { totalCents: 0, subcategories: new Map() });
      }

      const entry = spending.get(rootName)!;
      entry.totalCents += item.amountCents;

      if (subName) {
        entry.subcategories.set(subName, (entry.subcategories.get(subName) ?? 0) + item.amountCents);
      }
    }

    return spending;
  }, [activity]);

  const ccSingleInstallmentExpenses = (activity?.items ?? [])
    .filter(
      (i) =>
        i.kind === "CREDIT_CARD_INSTALLMENT" &&
        (i.installmentInfo?.installmentsCount ?? 1) === 1 &&
        i.type === "EXPENSE"
    )
    .reduce((sum, i) => sum + i.amountCents, 0);

  const totalExpensesCents = (summary?.totalExpenseCents ?? 0) + ccSingleInstallmentExpenses;

  const netTrend = !summary
    ? "neutral"
    : summary.netBalanceCents >= 0
    ? "positive"
    : "negative";

  return (
    <div className="space-y-6 md:space-y-8">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-1 mt-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground w-36 text-center">
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
                onClick={() => { setYear(currentYear); setMonth(currentMonth); }}
              >
                Hoy
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <ImportLegacyPurchaseDialog />
          <CreateTransferDialog
            trigger={
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="h-4 w-4 mr-1.5" />
                Transferir
              </Button>
            }
          />
          <CreateMovementDialog />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          title="Ingresos del período"
          value={summary ? formatCurrency(summary.totalIncomeCents) : "—"}
          subtitle={`${summary?.movementsCount ?? 0} movimientos`}
          icon={TrendingUp}
          trend="positive"
          loading={loadingSummary}
        />
        <KpiCard
          title="Gastos del período"
          value={summary && activity ? formatCurrency(totalExpensesCents) : "—"}
          icon={TrendingDown}
          trend="negative"
          loading={loadingSummary || loadingActivity}
        />
        <KpiCard
          title="Balance neto"
          value={summary ? formatCurrency(summary.netBalanceCents) : "—"}
          icon={Minus}
          trend={netTrend}
          loading={loadingSummary}
        />
        {/* KPI Tarjetas */}
        <Card className="p-4 sm:p-5 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tarjetas</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          {loadingActivity || !installmentsOverview ? (
            <div className="space-y-1.5">
              <div className="h-7 w-28 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              {(() => {
                const ccItems = (activity?.items ?? []).filter(
                  (i) => i.kind === "CREDIT_CARD_INSTALLMENT"
                );
                const totalCuotas = ccItems
                  .filter((i) => (i.installmentInfo?.installmentsCount ?? 1) > 1)
                  .reduce((sum, i) => sum + i.amountCents, 0);
                const totalCompras = ccItems
                  .filter((i) => (i.installmentInfo?.installmentsCount ?? 1) === 1)
                  .reduce((sum, i) => sum + i.amountCents, 0);

                return (
                  <>
                    <p className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight">
                      {formatCurrency(totalCuotas + totalCompras)}
                    </p>
                    <div className="flex flex-col gap-1 border-t pt-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Cuotas</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(totalCuotas)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Compras</span>
                        <span className="font-medium tabular-nums">
                          {formatCurrency(totalCompras)}
                        </span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}
        </Card>
      </div>

      {/* Gastos por categoría */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Gastos por categoría</h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {TRACKED_CATEGORIES.map((catName) => {
            const entry = categorySpending.get(catName);
            const subcategories = entry
              ? Array.from(entry.subcategories.entries())
                  .map(([name, totalCents]) => ({ name, totalCents }))
                  .sort((a, b) => b.totalCents - a.totalCents)
              : [];
            return (
              <CategorySpendCard
                key={catName}
                categoryName={catName}
                totalCents={entry?.totalCents ?? 0}
                subcategories={subcategories}
                loading={loadingActivity}
              />
            );
          })}
        </div>
      </div>

      {/* Gastos fijos */}
      {(() => {
        const occs = recurringOccurrences ?? [];
        const overdue = occs.filter((o) => o.status === "OVERDUE");
        const pending = occs.filter((o) => o.status === "PENDING");
        const paid = occs.filter((o) => o.status === "PAID");
        const pendingCount = overdue.length + pending.length;
        const sorted = [...overdue, ...pending, ...paid];

        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Gastos fijos</h2>
                {!loadingRecurring && occs.length > 0 && (
                  <span
                    className={
                      pendingCount > 0
                        ? "text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }
                  >
                    {pendingCount > 0 ? `${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}` : "Todo al día"}
                  </span>
                )}
              </div>
              <Link href="/recurring-expenses" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todos →
              </Link>
            </div>

            <div className="rounded-lg border bg-card px-4">
              {loadingRecurring ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 rounded bg-muted animate-pulse" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-5">
                  No hay gastos fijos configurados para este período.{" "}
                  <Link href="/recurring-expenses" className="underline hover:no-underline">
                    Configurar
                  </Link>
                </p>
              ) : (
                sorted.map((occ, i) => (
                  <OccurrenceRow
                    key={`${occ.recurringExpense.id}-${occ.dueDate}-${i}`}
                    occurrence={occ}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        );
      })()}

      {/* Actividad del período */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Actividad del período</h2>
        <Tabs defaultValue="movimientos">
          <TabsList>
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
          </TabsList>

          <TabsContent value="movimientos">
            <MovementsTable
              items={(activity?.items ?? []).filter(
                (i) =>
                  i.kind === "MOVEMENT" ||
                  (i.kind === "CREDIT_CARD_INSTALLMENT" &&
                    (i.installmentInfo?.installmentsCount ?? 1) === 1)
              )}
              loading={loadingActivity}
            />
          </TabsContent>

          <TabsContent value="cuotas">
            <InstallmentsTable
              items={(activity?.items ?? []).filter(
                (i) =>
                  i.kind === "CREDIT_CARD_INSTALLMENT" &&
                  (i.installmentInfo?.installmentsCount ?? 1) > 1
              )}
              loading={loadingActivity}
            />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
