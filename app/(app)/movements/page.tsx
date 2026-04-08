"use client";

import { useEffect, useMemo, useState } from "react";
import { useMovementsSummary } from "@/features/movements/hooks/useMovementsSummary";
import { useDashboardActivity } from "@/features/dashboard/hooks/useDashboardActivity";
import { useCreditCardPurchasesByDate } from "@/features/credit-card-purchases/hooks/useCreditCardPurchasesByDate";
import { CreditCardPurchaseByDate } from "@/features/credit-card-purchases/api/credit-card-purchases.api";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { MovementsTable } from "@/features/movements/components/MovementsTable";
import { CreateMovementDialog } from "@/features/movements/components/CreateMovementDialog";
import { KpiCard } from "@/features/movements/components/KpiCard";
import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";
import { MovementType } from "@/features/movements/api/movements.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  BarChart3,
  SlidersHorizontal,
  Check,
  CreditCard,
  Plus,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  CASH:   "Efectivo",
  BANK:   "Banco / Débito",
  WALLET: "Billetera digital",
};

function ccPurchaseToActivityItem(p: CreditCardPurchaseByDate): DashboardActivityItem {
  return {
    kind: "CREDIT_CARD_INSTALLMENT",
    id: p.id,
    type: p.isCredit ? "INCOME" : "EXPENSE",
    amountCents: p.totalAmountCents,
    description: p.description,
    occurredAt: p.occurredAt,
    purchaseDate: p.occurredAt,
    registeredAt: p.occurredAt,
    isRecurring: false,
    tags: [],
    account: null,
    creditCard: p.creditCard,
    installmentInfo: p.installmentsCount > 1
      ? { installmentNumber: 1, installmentsCount: p.installmentsCount, purchaseId: p.id, reimbursementAmountCents: null, reimbursementAccountId: null, reimbursementAt: null, isCredit: p.isCredit }
      : null,
    transferData: null,
    sharedExpense: null,
    incomeSource: null,
    balanceAdjustmentIncreased: null,
    category: p.category,
  };
}


// ── MultiCheckCombo ────────────────────────────────────────────────────────────

type MultiCheckItem = {
  id: number;
  label: string;
  sublabel?: string;
  group?: string;
};

type MultiCheckComboProps = {
  allLabel: string;
  entityLabel: string;
  items: MultiCheckItem[];
  selected: Set<number> | null;
  onChange: (next: Set<number> | null) => void;
  disabled?: boolean;
  groups?: Record<string, string>;
};

function MultiCheckCombo({
  allLabel,
  entityLabel,
  items,
  selected,
  onChange,
  disabled,
  groups,
}: MultiCheckComboProps) {
  const [open, setOpen] = useState(false);

  const allSelected  = selected === null;
  const noneSelected = selected !== null && selected.size === 0;
  const triggerLabel = allSelected
    ? allLabel
    : noneSelected
    ? `Ninguna`
    : `${selected.size} de ${items.length} ${entityLabel}`;

  function toggleAll()  { onChange(null); }
  function toggleNone() { onChange(new Set()); }

  function toggle(id: number) {
    const base = selected === null ? new Set(items.map((i) => i.id)) : new Set(selected);
    if (base.has(id)) {
      base.delete(id);
      if (base.size === items.length) { onChange(null); return; }
    } else {
      base.add(id);
      if (base.size === items.length) { onChange(null); return; }
    }
    onChange(base);
  }

  const groupedItems = useMemo(() => {
    if (!groups) return null;
    const map = new Map<string, MultiCheckItem[]>();
    for (const item of items) {
      const g = item.group ?? "";
      (map.get(g) ?? map.set(g, []).get(g))!.push(item);
    }
    return map;
  }, [items, groups]);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          onClick={() => !disabled && setOpen((o) => !o)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-xs sm:text-sm ring-offset-background transition-colors",
            "hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            !allSelected && "font-medium text-foreground",
            allSelected && "text-muted-foreground",
            disabled && "opacity-40 pointer-events-none cursor-not-allowed",
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 w-56" align="start">
        <button
          onClick={toggleAll}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <span className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
            allSelected ? "bg-primary border-primary text-primary-foreground" : "border-input",
          )}>
            {allSelected && <Check className="h-3 w-3" />}
          </span>
          <span className="font-medium">Todas</span>
        </button>
        <button
          onClick={toggleNone}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <span className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
            noneSelected ? "bg-primary border-primary text-primary-foreground" : "border-input",
          )}>
            {noneSelected && <Check className="h-3 w-3" />}
          </span>
          <span className="font-medium">Ninguna</span>
        </button>
        <div className="h-px bg-border my-1" />
        {groupedItems
          ? [...groupedItems.entries()].map(([groupKey, groupItems]) => (
              <div key={groupKey}>
                {groups![groupKey] && (
                  <p className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {groups![groupKey]}
                  </p>
                )}
                {groupItems.map((item) => {
                  const checked = allSelected || (!noneSelected && selected!.has(item.id));
                  return (
                    <button key={item.id} onClick={() => toggle(item.id)}
                      className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                    >
                      <span className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                        checked ? "bg-primary border-primary text-primary-foreground" : "border-input",
                      )}>
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      {item.sublabel && <span className="text-muted-foreground text-xs shrink-0">{item.sublabel}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          : items.map((item) => {
              const checked = allSelected || (!noneSelected && selected!.has(item.id));
              return (
                <button key={item.id} onClick={() => toggle(item.id)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <span className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                    checked ? "bg-primary border-primary text-primary-foreground" : "border-input",
                  )}>
                    {checked && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.sublabel && <span className="text-muted-foreground text-xs shrink-0">{item.sublabel}</span>}
                </button>
              );
            })}
      </PopoverContent>
    </Popover>
  );
}

// ── FilterChip ─────────────────────────────────────────────────────────────────

function FilterChip({
  active,
  color,
  onClick,
  children,
}: {
  active?: boolean;
  color?: string | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs border transition-colors select-none",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground",
      )}
      style={
        active && color
          ? { backgroundColor: `${color}20`, color, borderColor: `${color}60` }
          : undefined
      }
    >
      {children}
    </button>
  );
}

// ── SpendingByCategoryChart ───────────────────────────────────────────────────

type CategoryStat = { name: string; color: string | null; amountCents: number; count: number };

function SpendingByCategoryChart({ items, title = "Gastos por categoría" }: { items: DashboardActivityItem[]; title?: string }) {
  const stats = useMemo<CategoryStat[]>(() => {
    const map = new Map<string, CategoryStat>();
    for (const item of items) {
      if (item.type !== "EXPENSE" || !item.category) continue;
      const cat   = item.category;
      const key   = cat.parent ? String(cat.parent.id) : String(cat.id);
      const label = cat.parent ? cat.parent.name : cat.name;
      const color = cat.parent?.color ?? cat.color ?? null;
      const ex = map.get(key);
      if (ex) { ex.amountCents += item.amountCents; ex.count += 1; }
      else map.set(key, { name: label, color, amountCents: item.amountCents, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.amountCents - a.amountCents).slice(0, 7);
  }, [items]);

  if (stats.length === 0) return null;

  const max   = stats[0].amountCents;
  const total = stats.reduce((s, c) => s + c.amountCents, 0);

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold">{title}</p>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-3">
        {stats.map((stat, i) => {
          const pct     = Math.round((stat.amountCents / max) * 100);
          const ofTotal = Math.round((stat.amountCents / total) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: stat.color ?? "#94a3b8" }} />
                  <span className="text-sm truncate">{stat.name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{stat.count}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-6 text-right tabular-nums">{ofTotal}%</span>
                  <span className="text-sm font-medium tabular-nums w-24 text-right">{formatCurrency(stat.amountCents)}</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: stat.color ?? "#94a3b8" }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── CreditCardDistributionChart ────────────────────────────────────────────────

const CARD_COLOR_FALLBACK = "#94a3b8";

type CardStat = { name: string; last4: string; color: string; amountCents: number; count: number };

function CreditCardDistributionChart({
  items,
  cardColorMap,
}: {
  items: DashboardActivityItem[];
  cardColorMap: Record<number, string | null | undefined>;
}) {
  const stats = useMemo<CardStat[]>(() => {
    const map = new Map<number, CardStat>();
    for (const item of items) {
      if (item.kind !== "CREDIT_CARD_INSTALLMENT" || !item.creditCard) continue;
      const card = item.creditCard;
      const color = cardColorMap[card.id] || CARD_COLOR_FALLBACK;
      const ex = map.get(card.id);
      if (ex) { ex.amountCents += item.amountCents; ex.count += 1; }
      else map.set(card.id, { name: card.name, last4: card.cardLast4, color, amountCents: item.amountCents, count: 1 });
    }
    return [...map.values()].sort((a, b) => b.amountCents - a.amountCents);
  }, [items, cardColorMap]);

  if (stats.length === 0) return null;

  const max   = stats[0].amountCents;
  const total = stats.reduce((s, c) => s + c.amountCents, 0);

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold">Cuotas por tarjeta</p>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-3">
        {stats.map((stat, i) => {
          const pct     = Math.round((stat.amountCents / max) * 100);
          const ofTotal = Math.round((stat.amountCents / total) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: stat.color || CARD_COLOR_FALLBACK }} />
                  <span className="text-sm truncate">{stat.name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">····{stat.last4}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{stat.count}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-6 text-right tabular-nums">{ofTotal}%</span>
                  <span className="text-sm font-medium tabular-nums w-24 text-right">{formatCurrency(stat.amountCents)}</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: stat.color || CARD_COLOR_FALLBACK }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── PaymentSourceChart ────────────────────────────────────────────────────────

const ACCOUNT_TYPE_COLOR: Record<string, string> = {
  CASH:   "#f59e0b",
  BANK:   "#3b82f6",
  WALLET: "#8b5cf6",
};

const ACCOUNT_TYPE_LABEL_SHORT: Record<string, string> = {
  CASH:   "Efectivo",
  BANK:   "Débito / Transferencia",
  WALLET: "Billetera digital",
};

type PaymentStat = { key: string; label: string; sublabel?: string; color: string; amountCents: number; count: number };

function PaymentSourceChart({
  items,
  cardColorMap,
}: {
  items: DashboardActivityItem[];
  cardColorMap: Record<number, string | null | undefined>;
}) {
  const stats = useMemo<PaymentStat[]>(() => {
    const map = new Map<string, PaymentStat>();

    for (const item of items) {
      if (item.type !== "EXPENSE") continue;

      let key: string;
      let label: string;
      let sublabel: string | undefined;
      let color: string;

      if (item.kind === "CREDIT_CARD_INSTALLMENT" && item.creditCard) {
        key      = `cc-${item.creditCard.id}`;
        label    = item.creditCard.name;
        sublabel = `····${item.creditCard.cardLast4}`;
        color    = cardColorMap[item.creditCard.id] || CARD_COLOR_FALLBACK;
      } else if (item.account) {
        key      = `acc-${item.account.type}`;
        label    = ACCOUNT_TYPE_LABEL_SHORT[item.account.type] ?? item.account.type;
        color    = ACCOUNT_TYPE_COLOR[item.account.type] ?? "#94a3b8";
      } else {
        continue;
      }

      const ex = map.get(key);
      if (ex) { ex.amountCents += item.amountCents; ex.count += 1; }
      else map.set(key, { key, label, sublabel, color, amountCents: item.amountCents, count: 1 });
    }

    return [...map.values()].sort((a, b) => b.amountCents - a.amountCents);
  }, [items, cardColorMap]);

  if (stats.length === 0) return null;

  const max   = stats[0].amountCents;
  const total = stats.reduce((s, c) => s + c.amountCents, 0);

  return (
    <div className="rounded-xl border bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
        <p className="text-sm font-semibold">Gastos por medio de pago</p>
        <span className="ml-auto text-xs text-muted-foreground tabular-nums">
          {formatCurrency(total)}
        </span>
      </div>
      <div className="space-y-3">
        {stats.map((stat, i) => {
          const pct     = Math.round((stat.amountCents / max) * 100);
          const ofTotal = Math.round((stat.amountCents / total) * 100);
          return (
            <div key={i}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 w-2 h-2 rounded-full" style={{ background: stat.color }} />
                  <span className="text-sm truncate">{stat.label}</span>
                  {stat.sublabel && (
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{stat.sublabel}</span>
                  )}
                  <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{stat.count}</span>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground w-6 text-right tabular-nums">{ofTotal}%</span>
                  <span className="text-sm font-medium tabular-nums w-24 text-right">{formatCurrency(stat.amountCents)}</span>
                </div>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: stat.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── SectionCounter ─────────────────────────────────────────────────────────────

function SectionCounter({
  filtered,
  total,
  label,
  expenseTotal,
}: {
  filtered: number;
  total: number;
  label: string;
  expenseTotal: number;
}) {
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
      <span>
        {filtered === total
          ? `${total} ${label}${total !== 1 ? "s" : ""}`
          : `${filtered} de ${total} ${label}${total !== 1 ? "s" : ""}`}
      </span>
      {expenseTotal > 0 && (
        <span className="tabular-nums">{formatCurrency(expenseTotal)} en gastos</span>
      )}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function MovementsPage() {
  useEffect(() => { document.title = "Movimientos | Finantrack"; }, []);

  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  // ── Filtros — Movimientos ──────────────────────────────────────────────────
  const [movTypeFilter,       setMovTypeFilter]       = useState<"ALL" | MovementType>("ALL");
  const [movParentId,         setMovParentId]         = useState<number | null>(null);
  const [movChildIds,         setMovChildIds]         = useState<Set<number>>(new Set());
  const [movAccountIds,       setMovAccountIds]       = useState<Set<number> | null>(null);
  const [movCardIds,          setMovCardIds]          = useState<Set<number> | null>(null);
  const [movSearch,           setMovSearch]           = useState("");

  // ── Filtros — Cuotas ───────────────────────────────────────────────────────
  const [ccCardIds,           setCcCardIds]           = useState<Set<number> | null>(null);
  const [ccParentId,          setCcParentId]          = useState<number | null>(null);
  const [ccChildIds,          setCcChildIds]          = useState<Set<number>>(new Set());
  const [ccSearch,            setCcSearch]            = useState("");

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const fromDate = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
  const toDate   = new Date(Date.UTC(year, month,     0)).toISOString().slice(0, 10);

  // ── Data ───────────────────────────────────────────────────────────────────

  const { data: summary, isLoading: summaryLoading } = useMovementsSummary({ fromDate, toDate });

  const { data: accounts    = [] } = useAccounts({ status: "active" });
  const { data: categories  = [] } = useCategories();
  const { data: creditCards = [] } = useCreditCards();
  const { data: dashActivity      } = useDashboardActivity(year, month);
  const { data: ccPurchases = []  } = useCreditCardPurchasesByDate(fromDate, toDate);

  const movLoading = !dashActivity;

  // ── Derived lists ──────────────────────────────────────────────────────────

  const activeCards = useMemo(() => creditCards.filter((c) => c.isActive), [creditCards]);

  const cardColorMap = useMemo<Record<number, string | null | undefined>>(
    () => Object.fromEntries(creditCards.map((c) => [c.id, c.backgroundColor])),
    [creditCards],
  );

  const selectableAccounts = useMemo(
    () => accounts.filter((a) => a.type !== "CREDIT_CARD"),
    [accounts],
  );

  const accountComboItems = useMemo<MultiCheckItem[]>(
    () => selectableAccounts.map((a) => ({ id: a.id, label: a.name, group: a.type })),
    [selectableAccounts],
  );

  const cardComboItems = useMemo<MultiCheckItem[]>(
    () => activeCards.map((c) => ({ id: c.id, label: c.name, sublabel: `····${c.cardLast4}` })),
    [activeCards],
  );

  const movCategories = useMemo(() => {
    if (movTypeFilter === "ALL") return categories;
    const t = movTypeFilter === "INCOME" ? "INCOME" : "EXPENSE";
    return categories.filter((c) => c.type === t);
  }, [categories, movTypeFilter]);

  const ccCategories = useMemo(
    () => categories.filter((c) => c.type === "EXPENSE"),
    [categories],
  );

  const movParent = useMemo(
    () => categories.find((c) => c.id === movParentId) ?? null,
    [categories, movParentId],
  );

  const ccParent = useMemo(
    () => categories.find((c) => c.id === ccParentId) ?? null,
    [categories, ccParentId],
  );

  // ── Handlers — Movimientos ─────────────────────────────────────────────────

  function handleMovTypeChange(value: string) {
    const next = value as "ALL" | MovementType;
    setMovTypeFilter(next);
    if (movParentId !== null && next !== "ALL") {
      const parent = categories.find((c) => c.id === movParentId);
      if (parent && parent.type !== (next === "INCOME" ? "INCOME" : "EXPENSE")) {
        setMovParentId(null);
        setMovChildIds(new Set());
      }
    }
  }

  function handleMovParentChange(value: string) {
    setMovParentId(value === "ALL" ? null : Number(value));
    setMovChildIds(new Set());
  }

  function toggleMovChild(childId: number, allChildIds: number[]) {
    setMovChildIds((prev) => {
      const next = new Set(prev.size === 0 ? allChildIds : prev);
      if (next.has(childId)) {
        next.delete(childId);
        if (next.size === allChildIds.length) return new Set();
      } else {
        next.add(childId);
        if (next.size === allChildIds.length) return new Set();
      }
      return next;
    });
  }

  function clearMovFilters() {
    setMovTypeFilter("ALL");
    setMovParentId(null);
    setMovChildIds(new Set());
    setMovAccountIds(null);
    setMovCardIds(null);
    setMovSearch("");
  }

  // ── Handlers — Cuotas ─────────────────────────────────────────────────────

  function handleCcParentChange(value: string) {
    setCcParentId(value === "ALL" ? null : Number(value));
    setCcChildIds(new Set());
  }

  function toggleCcChild(childId: number, allChildIds: number[]) {
    setCcChildIds((prev) => {
      const next = new Set(prev.size === 0 ? allChildIds : prev);
      if (next.has(childId)) {
        next.delete(childId);
        if (next.size === allChildIds.length) return new Set();
      } else {
        next.add(childId);
        if (next.size === allChildIds.length) return new Set();
      }
      return next;
    });
  }

  function clearCcFilters() {
    setCcCardIds(null);
    setCcParentId(null);
    setCcChildIds(new Set());
    setCcSearch("");
  }

  // ── Items assembly — Movimientos ───────────────────────────────────────────

  // Todas las compras CC por occurredAt (aparecen en movimientos por fecha de compra)
  // Se excluyen los créditos/devoluciones de tarjeta (isCredit), no son movimientos de cuenta
  const ccPurchaseItems = useMemo<DashboardActivityItem[]>(
    () => ccPurchases.filter((p) => !p.isCredit).map(ccPurchaseToActivityItem),
    [ccPurchases],
  );

  const allMovItems = useMemo<DashboardActivityItem[]>(() => {
    // Movimientos regulares desde dashActivity (incluye TRANSFER, BALANCE_ADJUSTMENT, etc.)
    let movs = (dashActivity?.items ?? []).filter((i) => i.kind === "MOVEMENT");
    if (movTypeFilter === "INCOME") {
      movs = movs.filter((m) => m.type === "INCOME");
    } else if (movTypeFilter === "EXPENSE") {
      movs = movs.filter((m) => m.type === "EXPENSE");
    }
    if (movAccountIds !== null) {
      movs = movs.filter((m) => m.account && movAccountIds.has(m.account.id));
    }

    // Compras CC por occurredAt (créditos se excluyen si filtro es EXPENSE, compras si filtro es INCOME)
    let ccItems = ccPurchaseItems;
    if (movTypeFilter === "INCOME") ccItems = ccItems.filter((i) => i.type === "INCOME");
    if (movTypeFilter === "EXPENSE") ccItems = ccItems.filter((i) => i.type === "EXPENSE");
    if (movCardIds !== null) {
      ccItems = ccItems.filter((i) => i.creditCard && movCardIds.has(i.creditCard.id));
    }

    const combined = [...movs, ...ccItems];
    combined.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    return combined;
  }, [dashActivity, ccPurchaseItems, movTypeFilter, movAccountIds, movCardIds]);

  const filteredMovItems = useMemo(() => {
    let items = allMovItems;

    if (movParentId !== null && movParent) {
      if (movParent.children.length > 0 && movChildIds.size > 0) {
        // Subcategorías específicas seleccionadas — solo esas
        items = items.filter((i) => movChildIds.has(i.category?.id ?? -1));
      } else {
        // Toda la categoría: padre directo + cualquier subcategoría
        items = items.filter(
          (i) => i.category?.id === movParentId || i.category?.parent?.id === movParentId,
        );
      }
    }

    if (movSearch.trim()) {
      const q = movSearch.toLowerCase();
      items = items.filter(
        (i) =>
          i.description?.toLowerCase().includes(q) ||
          i.account?.name.toLowerCase().includes(q) ||
          i.creditCard?.name.toLowerCase().includes(q) ||
          i.category?.name.toLowerCase().includes(q) ||
          i.category?.parent?.name.toLowerCase().includes(q),
      );
    }

    return items;
  }, [allMovItems, movParentId, movParent, movChildIds, movSearch]);

  // ── Items assembly — Cuotas ────────────────────────────────────────────────

  const allCcItems = useMemo<DashboardActivityItem[]>(() => {
    const items = (dashActivity?.items ?? []).filter((item) => {
      if (item.kind !== "CREDIT_CARD_INSTALLMENT") return false;
      // Solo compras con más de 1 cuota
      if ((item.installmentInfo?.installmentsCount ?? 1) <= 1) return false;
      if (ccCardIds !== null && (!item.creditCard || !ccCardIds.has(item.creditCard.id))) return false;
      return true;
    });
    items.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    return items;
  }, [dashActivity, ccCardIds]);

  const filteredCcItems = useMemo(() => {
    let items = allCcItems;

    if (ccParentId !== null && ccParent) {
      if (ccParent.children.length > 0 && ccChildIds.size > 0) {
        // Subcategorías específicas seleccionadas — solo esas
        items = items.filter((i) => ccChildIds.has(i.category?.id ?? -1));
      } else {
        // Toda la categoría: padre directo + cualquier subcategoría
        items = items.filter(
          (i) => i.category?.id === ccParentId || i.category?.parent?.id === ccParentId,
        );
      }
    }

    if (ccSearch.trim()) {
      const q = ccSearch.toLowerCase();
      items = items.filter(
        (i) =>
          i.description?.toLowerCase().includes(q) ||
          i.creditCard?.name.toLowerCase().includes(q) ||
          i.category?.name.toLowerCase().includes(q) ||
          i.category?.parent?.name.toLowerCase().includes(q),
      );
    }

    return items;
  }, [allCcItems, ccParentId, ccParent, ccChildIds, ccSearch]);

  // ── Active filter chips ────────────────────────────────────────────────────

  const movFilterChips = [
    movTypeFilter !== "ALL" && {
      label: movTypeFilter === "INCOME" ? "Ingresos" : "Gastos",
      clear: () => setMovTypeFilter("ALL"),
    },
    movParent && {
      label: movParent.name,
      clear: () => { setMovParentId(null); setMovChildIds(new Set()); },
    },
    movAccountIds !== null && {
      label: movAccountIds.size === 0
        ? "Ninguna cuenta"
        : movAccountIds.size === 1
        ? (selectableAccounts.find((a) => movAccountIds.has(a.id))?.name ?? "Cuenta")
        : `${movAccountIds.size} de ${selectableAccounts.length} cuentas`,
      clear: () => setMovAccountIds(null),
    },
    movCardIds !== null && {
      label: movCardIds.size === 0
        ? "Ninguna tarjeta"
        : movCardIds.size === 1
        ? (activeCards.find((c) => movCardIds.has(c.id))?.name ?? "Tarjeta")
        : `${movCardIds.size} de ${activeCards.length} tarjetas`,
      clear: () => setMovCardIds(null),
    },
    movSearch.trim() && {
      label: `"${movSearch.trim()}"`,
      clear: () => setMovSearch(""),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const ccFilterChips = [
    ccCardIds !== null && {
      label: ccCardIds.size === 0
        ? "Ninguna tarjeta"
        : ccCardIds.size === 1
        ? (activeCards.find((c) => ccCardIds.has(c.id))?.name ?? "Tarjeta")
        : `${ccCardIds.size} de ${activeCards.length} tarjetas`,
      clear: () => setCcCardIds(null),
    },
    ccParent && {
      label: ccParent.name,
      clear: () => { setCcParentId(null); setCcChildIds(new Set()); },
    },
    ccSearch.trim() && {
      label: `"${ccSearch.trim()}"`,
      clear: () => setCcSearch(""),
    },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  // ── Tarjetas KPI ──────────────────────────────────────────────────────────

  const totalCuotas  = useMemo(
    () => (dashActivity?.items ?? [])
      .filter((i) => i.kind === "CREDIT_CARD_INSTALLMENT" && (i.installmentInfo?.installmentsCount ?? 1) > 1)
      .reduce((s, i) => s + i.amountCents, 0),
    [dashActivity],
  );

  const totalCompras = useMemo(
    () => (dashActivity?.items ?? [])
      .filter((i) => i.kind === "CREDIT_CARD_INSTALLMENT" && (i.installmentInfo?.installmentsCount ?? 1) === 1)
      .reduce((s, i) => s + i.amountCents, 0),
    [dashActivity],
  );

  const ccLoading = !dashActivity;

  // ── Derived flags ──────────────────────────────────────────────────────────

  const movHasSubcats  = !!(movParent && movParent.children.length > 0);
  const ccHasSubcats   = !!(ccParent && ccParent.children.length > 0);

  const movExpenseTotal = filteredMovItems
    .filter((i) => i.type === "EXPENSE")
    .reduce((s, i) => s + i.amountCents, 0);

  const ccExpenseTotal = filteredCcItems
    .reduce((s, i) => s + i.amountCents, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* ── Header + período ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Movimientos</h1>
          <div className="flex items-center gap-0.5 mt-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="text-sm text-muted-foreground px-1 min-w-[9rem] text-center">
              {MONTHS[month - 1]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="pt-1">
          <CreateMovementDialog
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Nuevo movimiento</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <KpiCard title="Ingresos" value={formatCurrency(summary?.totalIncomeCents ?? 0)}  icon={TrendingUp}  trend="positive" loading={summaryLoading} />
        <KpiCard title="Gastos"   value={formatCurrency(summary?.totalExpenseCents ?? 0)} icon={TrendingDown} trend="negative" loading={summaryLoading} />
        <KpiCard title="Balance"  value={formatCurrency(summary?.netBalanceCents ?? 0)}   icon={Minus}        trend={(summary?.netBalanceCents ?? 0) >= 0 ? "positive" : "negative"} loading={summaryLoading} />

        {/* Tarjetas */}
        <Card className="p-4 sm:p-5 flex flex-col gap-2 sm:gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Tarjetas</span>
            <div className="p-2 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          {ccLoading ? (
            <div className="space-y-1.5">
              <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
              <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
              <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
            </div>
          ) : (
            <>
              <p className="text-xl sm:text-2xl font-bold tracking-tight">
                {formatCurrency(totalCuotas + totalCompras)}
              </p>
              <div className="flex flex-col gap-1 border-t pt-2">
                <div className="flex justify-between gap-1 text-xs">
                  <span className="text-muted-foreground truncate">Cuotas</span>
                  <span className="font-semibold tabular-nums shrink-0">{formatCurrency(totalCuotas)}</span>
                </div>
                <div className="flex justify-between gap-1 text-xs">
                  <span className="text-muted-foreground truncate">Directas</span>
                  <span className="font-semibold tabular-nums shrink-0">{formatCurrency(totalCompras)}</span>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ════════════════════════════════════════════
          SECCIÓN 1: MOVIMIENTOS DEL PERÍODO
          ════════════════════════════════════════════ */}
      <div className="space-y-4">

        {/* Encabezado de sección */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Movimientos del período</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Panel de filtros */}
        <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filtros</span>
            {movFilterChips.length > 0 && (
              <button
                onClick={clearMovFilters}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por descripción, cuenta o categoría…"
              value={movSearch}
              onChange={(e) => setMovSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {/* Tipo */}
            <Select value={movTypeFilter} onValueChange={handleMovTypeChange}>
              <SelectTrigger className="h-9 w-full text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los tipos</SelectItem>
                <SelectItem value="INCOME">Ingresos</SelectItem>
                <SelectItem value="EXPENSE">Gastos</SelectItem>
              </SelectContent>
            </Select>

            {/* Categoría */}
            <Select value={movParentId?.toString() ?? "ALL"} onValueChange={handleMovParentChange}>
              <SelectTrigger className="h-9 w-full text-xs sm:text-sm">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las categorías</SelectItem>
                {movCategories.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id.toString()}>
                    <span className="flex items-center gap-1.5">
                      {parent.color && (
                        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: parent.color }} />
                      )}
                      {parent.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cuentas */}
            <MultiCheckCombo
              allLabel="Todas las cuentas"
              entityLabel="cuentas"
              items={accountComboItems}
              selected={movAccountIds}
              onChange={setMovAccountIds}
              groups={ACCOUNT_TYPE_LABEL}
            />

            {/* Tarjetas (para filtrar compras CC de 1 cuota) */}
            <MultiCheckCombo
              allLabel="Todas las tarjetas"
              entityLabel="tarjetas"
              items={cardComboItems}
              selected={movCardIds}
              onChange={setMovCardIds}
              disabled={movTypeFilter === "INCOME"}
            />
          </div>

          {/* Chips contextuales */}
          {movHasSubcats && (
            <div className="border-t pt-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground shrink-0 w-20">Subcategorías</span>
                <FilterChip active={movChildIds.size === 0} onClick={() => setMovChildIds(new Set())}>
                  Todas
                </FilterChip>
                {movParent!.children.map((child) => {
                  const allIds   = movParent!.children.map((c) => c.id);
                  const isActive = movChildIds.size === 0 || movChildIds.has(child.id);
                  const color    = child.color ?? movParent!.color;
                  return (
                    <FilterChip key={child.id} active={isActive} color={isActive ? color : null} onClick={() => toggleMovChild(child.id, allIds)}>
                      {color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isActive ? color : undefined }} />}
                      {child.name}
                    </FilterChip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active filter badges */}
          {movFilterChips.length > 0 && (
            <div className="border-t pt-2.5 flex items-center gap-1.5 flex-wrap">
              {movFilterChips.map((f) => (
                <Badge
                  key={f.label}
                  variant="secondary"
                  className="gap-1 pr-1.5 h-6 text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={f.clear}
                >
                  {f.label}
                  <X className="h-3 w-3 opacity-50" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Gráficos */}
        {!movLoading && filteredMovItems.some((i) => i.type === "EXPENSE") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SpendingByCategoryChart items={filteredMovItems} />
            <PaymentSourceChart items={filteredMovItems} cardColorMap={cardColorMap} />
          </div>
        )}

        {/* Contador */}
        {!movLoading && (
          <SectionCounter
            filtered={filteredMovItems.length}
            total={allMovItems.length}
            label="movimiento"
            expenseTotal={movExpenseTotal}
          />
        )}

        {/* Tabla */}
        <MovementsTable items={filteredMovItems} loading={movLoading} />
      </div>

      {/* ════════════════════════════════════════════
          SECCIÓN 2: CUOTAS DE TARJETA
          ════════════════════════════════════════════ */}
      <div className="space-y-4 pb-6">

        {/* Encabezado de sección */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Cuotas de tarjeta</h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Panel de filtros */}
        <div className="rounded-xl border bg-card p-3 sm:p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Filtros</span>
            {ccFilterChips.length > 0 && (
              <button
                onClick={clearCcFilters}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar por descripción, tarjeta o categoría…"
              value={ccSearch}
              onChange={(e) => setCcSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Tarjetas */}
            <MultiCheckCombo
              allLabel="Todas las tarjetas"
              entityLabel="tarjetas"
              items={cardComboItems}
              selected={ccCardIds}
              onChange={setCcCardIds}
            />

            {/* Categoría */}
            <Select value={ccParentId?.toString() ?? "ALL"} onValueChange={handleCcParentChange}>
              <SelectTrigger className="h-9 w-full text-xs sm:text-sm">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas las categorías</SelectItem>
                {ccCategories.map((parent) => (
                  <SelectItem key={parent.id} value={parent.id.toString()}>
                    <span className="flex items-center gap-1.5">
                      {parent.color && (
                        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: parent.color }} />
                      )}
                      {parent.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chips subcategorías */}
          {ccHasSubcats && (
            <div className="border-t pt-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground shrink-0 w-20">Subcategorías</span>
                <FilterChip active={ccChildIds.size === 0} onClick={() => setCcChildIds(new Set())}>
                  Todas
                </FilterChip>
                {ccParent!.children.map((child) => {
                  const allIds   = ccParent!.children.map((c) => c.id);
                  const isActive = ccChildIds.size === 0 || ccChildIds.has(child.id);
                  const color    = child.color ?? ccParent!.color;
                  return (
                    <FilterChip key={child.id} active={isActive} color={isActive ? color : null} onClick={() => toggleCcChild(child.id, allIds)}>
                      {color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: isActive ? color : undefined }} />}
                      {child.name}
                    </FilterChip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active filter badges */}
          {ccFilterChips.length > 0 && (
            <div className="border-t pt-2.5 flex items-center gap-1.5 flex-wrap">
              {ccFilterChips.map((f) => (
                <Badge
                  key={f.label}
                  variant="secondary"
                  className="gap-1 pr-1.5 h-6 text-xs font-normal cursor-pointer hover:bg-secondary/80 transition-colors"
                  onClick={f.clear}
                >
                  {f.label}
                  <X className="h-3 w-3 opacity-50" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Gráficos */}
        {allCcItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CreditCardDistributionChart items={filteredCcItems} cardColorMap={cardColorMap} />
            <SpendingByCategoryChart items={filteredCcItems} title="Cuotas por categoría" />
          </div>
        )}

        {/* Contador */}
        <SectionCounter
          filtered={filteredCcItems.length}
          total={allCcItems.length}
          label="cuota"
          expenseTotal={ccExpenseTotal}
        />

        {/* Tabla */}
        <MovementsTable items={filteredCcItems} loading={false} />
      </div>

    </div>
  );
}
