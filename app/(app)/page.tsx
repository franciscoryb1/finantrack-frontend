"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft, ChevronRight,
  TrendingUp, TrendingDown,
  CreditCard, ArrowLeftRight,
  Wallet,
  Settings2,
  ListFilter,
  Sparkles,
  BadgePlus,
  MoveRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, cn } from "@/lib/utils";
import { MovementsTable } from "@/features/movements/components/MovementsTable";
import { InstallmentsTable } from "@/features/movements/components/InstallmentsTable";
import { CreateMovementDialog } from "@/features/movements/components/CreateMovementDialog";
import { ImportLegacyPurchaseDialog } from "@/features/credit-card-purchases/components/ImportLegacyPurchaseDialog";
import { CreateTransferDialog } from "@/features/account-transfers/components/CreateTransferDialog";
import { useMovementsSummary } from "@/features/movements/hooks/useMovementsSummary";
import { useDashboardActivity } from "@/features/dashboard/hooks/useDashboardActivity";
import { CategorySpendChart } from "@/features/dashboard/components/CategorySpendChart";
import { useRecurringExpenseOccurrences } from "@/features/recurring-expenses/hooks/useRecurringExpenseOccurrences";
import { OccurrenceRow } from "@/features/recurring-expenses/components/OccurrenceRow";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { AccountType } from "@/features/accounts/api/accounts.api";
import { TYPE_CONFIG } from "@/features/accounts/components/AccountItem";
import Link from "next/link";

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const isCurrentPeriod = year === now.getFullYear() && month === now.getMonth() + 1;

  useEffect(() => { document.title = "Dashboard | Finantrack"; }, []);

  function prevMonth() { month === 1 ? (setMonth(12), setYear(y => y - 1)) : setMonth(m => m - 1); }
  function nextMonth() { month === 12 ? (setMonth(1), setYear(y => y + 1)) : setMonth(m => m + 1); }

  const { fromDate, toDate } = getPeriodDates(year, month);

  const { data: summary, isLoading: loadingSummary } = useMovementsSummary({ fromDate, toDate });
  const { data: activity, isLoading: loadingActivity } = useDashboardActivity(year, month);
  const { data: occurrences, isLoading: loadingRecurring } = useRecurringExpenseOccurrences(year, month);
  const { data: accounts, isLoading: loadingAccounts } = useAccounts({ status: "active" });

  // ── Dashboard accounts config (localStorage) ─────────────────────────────────
  const ACCOUNTS_STORAGE_KEY = "dashboard:account-ids";
  const MAX_ACCOUNTS = 6;

  const [pinnedAccountIds, setPinnedAccountIds] = useState<number[] | null>(null);

  // Load from localStorage once on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (stored) setPinnedAccountIds(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Auto-initialize with first MAX_ACCOUNTS when localStorage is empty and accounts load
  useEffect(() => {
    if (pinnedAccountIds === null && accounts) {
      const ids = accounts.slice(0, MAX_ACCOUNTS).map(a => a.id);
      setPinnedAccountIds(ids);
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(ids));
    }
  }, [pinnedAccountIds, accounts]);

  const togglePinnedAccount = (id: number) => {
    setPinnedAccountIds(prev => {
      const current = prev ?? [];
      const next = current.includes(id)
        ? current.filter(x => x !== id)
        : current.length < MAX_ACCOUNTS ? [...current, id] : current;
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const displayedAccounts = useMemo(
    () => (accounts ?? []).filter(a => (pinnedAccountIds ?? []).includes(a.id)),
    [accounts, pinnedAccountIds],
  );

  // ── Chart toggles ────────────────────────────────────────────────────────────
  const [includeCuotas, setIncludeCuotas] = useState(false);
  const [hiddenCategories, setHiddenCategories] = useState<string[]>([]);

  const toggleCategory = (name: string) =>
    setHiddenCategories(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name],
    );

  // ── Derived data ────────────────────────────────────────────────────────────

  const categorySpending = useMemo(() => {
    const map = new Map<string, { totalCents: number; subcategories: Map<string, number> }>();
    for (const item of activity?.items ?? []) {
      if (item.type !== "EXPENSE" || !item.category) continue;
      // Excluir cuotas múltiples si el toggle está apagado
      if (!includeCuotas && item.kind === "CREDIT_CARD_INSTALLMENT" && (item.installmentInfo?.installmentsCount ?? 1) > 1) continue;
      const root = item.category.parent?.name ?? item.category.name;
      const sub = item.category.parent ? item.category.name : null;
      if (!map.has(root)) map.set(root, { totalCents: 0, subcategories: new Map() });
      const entry = map.get(root)!;
      entry.totalCents += item.amountCents;
      if (sub) entry.subcategories.set(sub, (entry.subcategories.get(sub) ?? 0) + item.amountCents);
    }
    return map;
  }, [activity, includeCuotas]);

  const filteredCategorySpending = useMemo(() => {
    if (hiddenCategories.length === 0) return categorySpending;
    const filtered = new Map(categorySpending);
    hiddenCategories.forEach(name => filtered.delete(name));
    return filtered;
  }, [categorySpending, hiddenCategories]);

  // Siempre incluye todas las categorías (con y sin cuotas) para las opciones del filtro
  const availableCategories = useMemo(() => {
    const names = new Set<string>();
    for (const item of activity?.items ?? []) {
      if (item.type !== "EXPENSE" || !item.category) continue;
      names.add(item.category.parent?.name ?? item.category.name);
    }
    return Array.from(names).sort();
  }, [activity]);

  const ccItems = (activity?.items ?? []).filter(i => i.kind === "CREDIT_CARD_INSTALLMENT");
  const totalCuotas = ccItems.filter(i => (i.installmentInfo?.installmentsCount ?? 1) > 1).reduce((s, i) => s + i.amountCents, 0);
  const totalCompras = ccItems.filter(i => (i.installmentInfo?.installmentsCount ?? 1) === 1).reduce((s, i) => s + i.amountCents, 0);
  const ccSingleExp = ccItems.filter(i => (i.installmentInfo?.installmentsCount ?? 1) === 1 && i.type === "EXPENSE").reduce((s, i) => s + i.amountCents, 0);

  const incomeCents = summary?.totalIncomeCents ?? 0;
  const expensesCents = (summary?.totalExpenseCents ?? 0) + ccSingleExp;
  const netCents = summary?.netBalanceCents ?? 0;
  const maxBar = Math.max(incomeCents, expensesCents, 1);
  const incomeBarPct = (incomeCents / maxBar) * 100;
  const expenseBarPct = (expensesCents / maxBar) * 100;

  const totalAccBalance = (accounts ?? []).reduce((s, a) => s + a.currentBalanceCents, 0);

  const overdue = (occurrences ?? []).filter(o => o.status === "OVERDUE");
  const pending = (occurrences ?? []).filter(o => o.status === "PENDING");
  const paid = (occurrences ?? []).filter(o => o.status === "PAID");
  const sortedOccs = [...overdue, ...pending, ...paid];
  const pendingCount = overdue.length + pending.length;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5 md:gap-6">

      {/* ── 1. Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <div className="flex items-center gap-1 mt-1.5">
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
                variant="outline" size="sm" className="h-7 px-2 text-xs ml-1"
                onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1); }}
              >
                Hoy
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <ImportLegacyPurchaseDialog />
          <CreateMovementDialog />
        </div>
      </div>

      {/* ── Onboarding banner (solo cuando no hay cuentas) ─────────────────── */}
      {!loadingAccounts && accounts?.length === 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">¡Bienvenido a Finantrack!</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Para empezar, creá una cuenta (efectivo, banco o billetera virtual) y luego registrá tus movimientos.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
                <BadgePlus className="h-3 w-3" /> Crear cuenta
              </span>
              <MoveRight className="h-3 w-3" />
              <span className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
                <BadgePlus className="h-3 w-3" /> Registrar movimiento
              </span>
              <MoveRight className="h-3 w-3" />
              <span className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5">
                <Sparkles className="h-3 w-3" /> Explorar
              </span>
            </div>
          </div>
          <Button asChild size="sm" className="shrink-0">
            <Link href="/accounts">Crear primera cuenta</Link>
          </Button>
        </div>
      )}

      {/* ── 2. Hero summary card ───────────────────────────────────────────── */}
      <Card className="overflow-hidden py-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border">

          {/* Balance neto */}
          <div className="bg-card p-5 flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
              Balance neto
            </span>
            {loadingSummary ? (
              <div className="space-y-2 mt-1">
                <div className="h-9 w-36 rounded bg-muted animate-pulse" />
                <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className={cn(
                  "text-3xl font-bold tabular-nums tracking-tight mt-1",
                  netCents >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                )}>
                  {formatCurrency(netCents)}
                </p>
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium",
                  netCents >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                )}>
                  {netCents >= 0
                    ? <TrendingUp className="h-3 w-3" />
                    : <TrendingDown className="h-3 w-3" />}
                  {netCents >= 0 ? "Superávit del período" : "Déficit del período"}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {summary?.movementsCount ?? 0} movimientos registrados
                </p>
              </>
            )}
          </div>

          {/* Ingresos */}
          <div className="bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Ingresos
              </span>
              <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            {loadingSummary ? (
              <div className="space-y-2">
                <div className="h-7 w-32 rounded bg-muted animate-pulse" />
                <div className="h-1.5 rounded-full bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(incomeCents)}
                </p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                    style={{ width: `${incomeBarPct}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Gastos */}
          <div className="bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Gastos
              </span>
              <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-900/20">
                <TrendingDown className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
              </div>
            </div>
            {loadingSummary || loadingActivity ? (
              <div className="space-y-2">
                <div className="h-7 w-32 rounded bg-muted animate-pulse" />
                <div className="h-1.5 rounded-full bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {formatCurrency(expensesCents)}
                </p>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-rose-500 transition-all duration-700"
                    style={{ width: `${expenseBarPct}%` }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Tarjetas */}
          <div className="bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                Tarjetas
              </span>
              <div className="p-1.5 rounded-md bg-slate-100 dark:bg-slate-800">
                <CreditCard className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
            {loadingActivity ? (
              <div className="space-y-2">
                <div className="h-7 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                <div className="h-3 w-24 rounded bg-muted animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold tabular-nums">
                  {formatCurrency(totalCuotas + totalCompras)}
                </p>
                <div className="flex flex-col gap-1.5 border-t pt-2.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Cuotas</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(totalCuotas)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Compras directas</span>
                    <span className="font-semibold tabular-nums">{formatCurrency(totalCompras)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>
      </Card>

      {/* ── 3. Desglose de gastos — full width ────────────────────────────────── */}
      <Card className="flex flex-col py-0 gap-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h2 className="text-sm font-semibold">Desglose de gastos</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Por categoría · {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filtro de categorías */}
            {availableCategories.length > 0 && <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <ListFilter className="h-3.5 w-3.5" />
                  Categorías
                  {hiddenCategories.length > 0 && (
                    <span className="ml-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 flex items-center justify-center">
                      {availableCategories.length - hiddenCategories.filter(h => availableCategories.includes(h)).length}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-60 p-0">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <p className="text-sm font-semibold">Categorías</p>
                  {hiddenCategories.length > 0 && (
                    <button
                      onClick={() => setHiddenCategories([])}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Ver todas
                    </button>
                  )}
                </div>
                <div className="py-1">
                  {availableCategories.map(name => {
                    const hidden = hiddenCategories.includes(name);
                    return (
                      <label
                        key={name}
                        className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={!hidden}
                          onCheckedChange={() => toggleCategory(name)}
                        />
                        <span className="text-sm">{name}</span>
                      </label>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>}

            {/* Toggle cuotas */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-muted-foreground">Incluir cuotas</span>
              <Switch checked={includeCuotas} onCheckedChange={setIncludeCuotas} />
            </label>
          </div>
        </div>
        <div className="p-4">
          <CategorySpendChart spending={filteredCategorySpending} loading={loadingActivity} />
        </div>
      </Card>

      {/* ── 4. Cuentas — full width ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Cuentas</h2>
            {!loadingAccounts && pinnedAccountIds !== null && (
              <span className="text-xs text-muted-foreground">
                {pinnedAccountIds.length}/{MAX_ACCOUNTS}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Config popover */}
            {!loadingAccounts && accounts && accounts.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                    <Settings2 className="h-3.5 w-3.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-72 p-0">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold">Cuentas a mostrar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Seleccioná hasta {MAX_ACCOUNTS}. Seleccionadas: {(pinnedAccountIds ?? []).length}/{MAX_ACCOUNTS}
                    </p>
                  </div>
                  <div className="py-1">
                    {accounts.map((acc) => {
                      const cfg = TYPE_CONFIG[acc.type];
                      const checked = (pinnedAccountIds ?? []).includes(acc.id);
                      const maxReached = (pinnedAccountIds ?? []).length >= MAX_ACCOUNTS && !checked;
                      return (
                        <label
                          key={acc.id}
                          className={cn(
                            "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                            maxReached ? "opacity-40 cursor-not-allowed" : "hover:bg-muted/50",
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            disabled={maxReached}
                            onCheckedChange={() => !maxReached && togglePinnedAccount(acc.id)}
                          />
                          <cfg.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{acc.name}</p>
                            <p className="text-xs text-muted-foreground">{cfg.label}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <CreateTransferDialog
              trigger={
                <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  Transferir
                </Button>
              }
            />
            <Link href="/accounts" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Ver todas →
            </Link>
          </div>
        </div>

        <Card className="overflow-hidden py-0 gap-0">
          {loadingAccounts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card flex items-center justify-between px-4 py-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                    <div className="space-y-1">
                      <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-3 w-14 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : !accounts?.length ? (
            <p className="text-sm text-muted-foreground text-center py-5 px-4">
              Sin cuentas activas.{" "}
              <Link href="/accounts" className="underline hover:no-underline">Crear</Link>
            </p>
          ) : displayedAccounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center">
              <p className="text-sm text-muted-foreground">Ninguna cuenta seleccionada.</p>
              <p className="text-xs text-muted-foreground">
                Usá el botón <Settings2 className="inline h-3 w-3" /> para elegir qué cuentas mostrar.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
                {displayedAccounts.map((acc) => {
                  const cfg = TYPE_CONFIG[acc.type];
                  const neg = acc.currentBalanceCents < 0;
                  return (
                    <div key={acc.id} className="bg-card flex items-center justify-between px-4 py-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <cfg.Icon className="h-3.5 w-3.5 shrink-0" style={{ color: cfg.color }} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate leading-tight">{acc.name}</p>
                          <p className="text-xs text-muted-foreground">{cfg.label}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold tabular-nums shrink-0 ml-3",
                        neg ? "text-rose-600 dark:text-rose-400" : "text-foreground",
                      )}>
                        {formatCurrency(acc.currentBalanceCents)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t flex items-center justify-between px-4 py-1.5 bg-muted/40">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</span>
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  displayedAccounts.reduce((s, a) => s + a.currentBalanceCents, 0) < 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-foreground",
                )}>
                  {formatCurrency(displayedAccounts.reduce((s, a) => s + a.currentBalanceCents, 0))}
                </span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── 5. Gastos fijos — full width ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Gastos recurrentes</h2>
            {!loadingRecurring && (occurrences ?? []).length > 0 && (
              <span className={cn(
                "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                pendingCount > 0
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
              )}>
                {pendingCount > 0 ? `${pendingCount} pendiente${pendingCount > 1 ? "s" : ""}` : "Al día ✓"}
              </span>
            )}
          </div>
          <Link href="/recurring-expenses" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Ver todos →
          </Link>
        </div>
        <Card className="overflow-hidden py-0 gap-0">
          {loadingRecurring ? (
            <div className="divide-y">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="px-4 py-3">
                  <div className="h-9 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : sortedOccs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Sin gastos recurrentes configurados para este período.{" "}
              <Link href="/recurring-expenses" className="underline hover:no-underline">Configurar</Link>
            </p>
          ) : (
            <div className="divide-y">
              {sortedOccs.map((occ, i) => (
                <div
                  key={`${occ.recurringExpense.id}-${occ.dueDate}-${i}`}
                  className={cn(
                    "px-4",
                    occ.status === "OVERDUE" && "bg-red-50/60 dark:bg-red-950/20",
                  )}
                >
                  <OccurrenceRow occurrence={occ} compact />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── 4. Actividad del período ───────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">Actividad del período</h2>
        <Tabs defaultValue="movimientos">
          <TabsList className="mb-1">
            <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
            <TabsTrigger value="cuotas">Cuotas</TabsTrigger>
          </TabsList>
          <TabsContent value="movimientos">
            <MovementsTable
              items={(activity?.items ?? []).filter(
                i => i.kind === "MOVEMENT" ||
                  (i.kind === "CREDIT_CARD_INSTALLMENT" && (i.installmentInfo?.installmentsCount ?? 1) === 1),
              )}
              loading={loadingActivity}
            />
          </TabsContent>
          <TabsContent value="cuotas">
            <InstallmentsTable
              items={(activity?.items ?? []).filter(
                i => i.kind === "CREDIT_CARD_INSTALLMENT" &&
                  (i.installmentInfo?.installmentsCount ?? 1) > 1,
              )}
              loading={loadingActivity}
            />
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
