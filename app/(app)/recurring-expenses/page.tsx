"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRecurringExpenses } from "@/features/recurring-expenses/hooks/useRecurringExpenses";
import { useRecurringExpenseOccurrences } from "@/features/recurring-expenses/hooks/useRecurringExpenseOccurrences";
import { CreateRecurringExpenseDialog } from "@/features/recurring-expenses/components/CreateRecurringExpenseDialog";
import { RecurringExpenseItem } from "@/features/recurring-expenses/components/RecurringExpenseItem";
import { OccurrenceRow } from "@/features/recurring-expenses/components/OccurrenceRow";
import { formatCurrency } from "@/lib/utils";
import type { RecurringFrequency } from "@/features/recurring-expenses/api/recurring-expenses.api";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const FREQUENCY_LABEL: Record<RecurringFrequency, string> = {
  MONTHLY:   "Mensual",
  BIWEEKLY:  "Quincenal",
  WEEKLY:    "Semanal",
};

type OccurrenceStatus = "OVERDUE" | "PENDING" | "PAID";

// ── MultiCheckCombo (string IDs) ──────────────────────────────────────────────

type StrCheckItem = { id: string; label: string };

function MultiCheckCombo({
  allLabel,
  items,
  selected,
  onChange,
}: {
  allLabel: string;
  items: StrCheckItem[];
  selected: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const allSelected  = selected === null;
  const noneSelected = selected !== null && selected.size === 0;
  const triggerLabel = allSelected
    ? allLabel
    : noneSelected
    ? "Ninguno"
    : items.filter((i) => selected.has(i.id)).map((i) => i.label).join(", ");

  function toggle(id: string) {
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn(
          "flex h-7 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors",
          allSelected
            ? "text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
            : "font-medium text-foreground border-foreground",
        )}>
          <span className="truncate max-w-40">{triggerLabel}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-1 w-44" align="start">
        <button onClick={() => onChange(null)}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
            allSelected ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
            {allSelected && <Check className="h-3 w-3" />}
          </span>
          <span className="font-medium">Todos</span>
        </button>
        <button onClick={() => onChange(new Set())}
          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
        >
          <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
            noneSelected ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
            {noneSelected && <Check className="h-3 w-3" />}
          </span>
          <span className="font-medium">Ninguno</span>
        </button>
        <div className="h-px bg-border my-1" />
        {items.map((item) => {
          const checked = allSelected || (!noneSelected && selected!.has(item.id));
          return (
            <button key={item.id} onClick={() => toggle(item.id)}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                checked ? "bg-primary border-primary text-primary-foreground" : "border-input")}>
                {checked && <Check className="h-3 w-3" />}
              </span>
              <span className="truncate flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  variant = "default",
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "overdue" | "pending" | "paid";
}) {
  const colorClass = {
    default:  active ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground",
    overdue:  active ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700" : "text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground",
    pending:  active ? "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700" : "text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground",
    paid:     active ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700" : "text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground",
  }[variant];

  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs border transition-colors select-none font-medium",
        colorClass,
      )}
    >
      {children}
    </button>
  );
}

export default function RecurringExpensesPage() {
  useEffect(() => { document.title = "Gastos recurrentes | Finantrack"; }, []);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // ── Filtros — Vencimientos ─────────────────────────────────────────────────
  const [occSearch,      setOccSearch]      = useState("");
  const [occStatusFilter, setOccStatusFilter] = useState<"ALL" | "PENDING" | "PAID">("ALL");

  // ── Filtros — Gastos configurados ──────────────────────────────────────────
  const [expSearch,     setExpSearch]     = useState("");
  const [expFrequency,  setExpFrequency]  = useState<Set<RecurringFrequency> | null>(null);
  const [expActiveOnly, setExpActiveOnly] = useState<Set<"ACTIVE" | "INACTIVE"> | null>(null);

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

  // ── Derived — Vencimientos ─────────────────────────────────────────────────

  const overdue = (occurrences ?? []).filter((o) => o.status === "OVERDUE");
  const pending = (occurrences ?? []).filter((o) => o.status === "PENDING");
  const paid    = (occurrences ?? []).filter((o) => o.status === "PAID");
  const pendingCount  = overdue.length + pending.length;
  const allOccurrences = [...overdue, ...pending, ...paid];

  const paidTotal    = paid.reduce((s, o) => s + (o.payment?.amountCents ?? o.recurringExpense.amountCents), 0);
  const pendingTotal = [...overdue, ...pending].reduce((s, o) => s + o.recurringExpense.amountCents, 0);
  const periodTotal  = paidTotal + pendingTotal;

  const filteredOccurrences = useMemo(() => {
    let items = allOccurrences;
    if (occStatusFilter === "PENDING") {
      items = items.filter((o) => o.status === "PENDING" || o.status === "OVERDUE");
    } else if (occStatusFilter === "PAID") {
      items = items.filter((o) => o.status === "PAID");
    }
    if (occSearch.trim()) {
      const q = occSearch.toLowerCase();
      items = items.filter(
        (o) =>
          o.recurringExpense.name.toLowerCase().includes(q) ||
          o.recurringExpense.category?.name.toLowerCase().includes(q),
      );
    }
    return items;
  }, [allOccurrences, occStatusFilter, occSearch]);

  // ── Derived — Gastos configurados ─────────────────────────────────────────

  const filteredExpenses = useMemo(() => {
    let items = expenses ?? [];
    if (expActiveOnly !== null) items = items.filter((e) => expActiveOnly.has(e.isActive ? "ACTIVE" : "INACTIVE"));
    if (expFrequency !== null)  items = items.filter((e) => expFrequency.has(e.frequency));
    if (expSearch.trim()) {
      const q = expSearch.toLowerCase();
      items = items.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.category?.name.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q),
      );
    }
    return items;
  }, [expenses, expActiveOnly, expFrequency, expSearch]);

  const hasOccFilters = occStatusFilter !== "ALL" || occSearch.trim();
  const hasExpFilters = expFrequency !== null || expActiveOnly !== null || expSearch.trim();

  return (
    <div className="space-y-8 max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Gastos fijos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Alquiler, servicios y otros gastos periódicos
          </p>
        </div>
        <CreateRecurringExpenseDialog />
      </div>

      {/* ════════════════════════════════════════════
          SECCIÓN 1: VENCIMIENTOS DEL PERÍODO
          ════════════════════════════════════════════ */}
      <div className="space-y-3">

        {/* Encabezado + selector de período */}
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
          {!loadingOccurrences && allOccurrences.length > 0 && (
            <span className={cn(
              "text-xs font-semibold px-2.5 py-1 rounded-full",
              pendingCount > 0
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            )}>
              {pendingCount > 0
                ? `${pendingCount} pendiente${pendingCount > 1 ? "s" : ""} · ${paid.length} pagado${paid.length !== 1 ? "s" : ""}`
                : `Todo al día · ${paid.length} pagado${paid.length !== 1 ? "s" : ""}`}
            </span>
          )}
        </div>

        {/* KPIs del período */}
        {!loadingOccurrences && allOccurrences.length > 0 && (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-lg border bg-card px-2.5 py-2.5 sm:px-4 sm:py-3 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pagado</p>
              <p className="text-[11px] xs:text-sm sm:text-lg font-bold text-green-600 dark:text-green-400 leading-tight break-all">{formatCurrency(paidTotal)}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{paid.length} ítem{paid.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-lg border bg-card px-2.5 py-2.5 sm:px-4 sm:py-3 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pendiente</p>
              <p className={cn("text-[11px] xs:text-sm sm:text-lg font-bold leading-tight break-all", pendingTotal > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>{formatCurrency(pendingTotal)}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{pendingCount} ítem{pendingCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-lg border bg-card px-2.5 py-2.5 sm:px-4 sm:py-3 min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total</p>
              <p className="text-[11px] xs:text-sm sm:text-lg font-bold leading-tight break-all">{formatCurrency(periodTotal)}</p>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">{allOccurrences.length} ítem{allOccurrences.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {/* Filtros de vencimientos */}
        {!loadingOccurrences && allOccurrences.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre o categoría…"
                value={occSearch}
                onChange={(e) => setOccSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Chips de estado */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <FilterChip active={occStatusFilter === "ALL"} onClick={() => setOccStatusFilter("ALL")}>
                Todos
              </FilterChip>
              <FilterChip variant="pending" active={occStatusFilter === "PENDING"} onClick={() => setOccStatusFilter("PENDING")}>
                Pendientes{pendingCount > 0 ? ` (${pendingCount})` : ""}
              </FilterChip>
              <FilterChip variant="paid" active={occStatusFilter === "PAID"} onClick={() => setOccStatusFilter("PAID")}>
                Pagados{paid.length > 0 ? ` (${paid.length})` : ""}
              </FilterChip>
            </div>
          </div>
        )}

        {/* Lista de vencimientos */}
        <div className="rounded-lg border bg-card px-4">
          {loadingOccurrences ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredOccurrences.length === 0 && allOccurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No hay gastos fijos configurados para este período
            </p>
          ) : filteredOccurrences.length === 0 ? (
            <div className="py-6 text-center space-y-1">
              <p className="text-sm text-muted-foreground">Sin resultados para los filtros aplicados.</p>
              <button
                onClick={() => { setOccSearch(""); setOccStatusFilter("ALL"); }}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div>
              {/* Contador si hay filtros */}
              {hasOccFilters && (
                <div className="flex items-center justify-between py-2 border-b text-xs text-muted-foreground">
                  <span>
                    {filteredOccurrences.length === allOccurrences.length
                      ? `${allOccurrences.length} vencimiento${allOccurrences.length !== 1 ? "s" : ""}`
                      : `${filteredOccurrences.length} de ${allOccurrences.length} vencimiento${allOccurrences.length !== 1 ? "s" : ""}`}
                  </span>
                  <button
                    onClick={() => { setOccSearch(""); setOccStatusFilter("ALL"); }}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    <X className="h-3 w-3" />
                    Limpiar
                  </button>
                </div>
              )}
              {filteredOccurrences.map((occ, i) => (
                <OccurrenceRow
                  key={`${occ.recurringExpense.id}-${occ.dueDate}-${i}`}
                  occurrence={occ}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          SECCIÓN 2: GASTOS CONFIGURADOS
          ════════════════════════════════════════════ */}
      <div className="space-y-3">

        {/* Encabezado */}
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">
            Gastos configurados
            {(expenses ?? []).length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredExpenses.length}{filteredExpenses.length !== (expenses ?? []).length && ` de ${(expenses ?? []).length}`})
              </span>
            )}
          </h2>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Filtros */}
        {!loadingExpenses && (expenses ?? []).length > 0 && (
          <div className="space-y-2">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar por nombre, descripción o categoría…"
                value={expSearch}
                onChange={(e) => setExpSearch(e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide shrink-0">Frecuencia</span>
              <MultiCheckCombo
                allLabel="Todas"
                items={[
                  { id: "MONTHLY",  label: "Mensual" },
                  { id: "BIWEEKLY", label: "Quincenal" },
                  { id: "WEEKLY",   label: "Semanal" },
                ]}
                selected={expFrequency as Set<string> | null}
                onChange={(v) => setExpFrequency(v as Set<RecurringFrequency> | null)}
              />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide shrink-0 ml-2">Estado</span>
              <MultiCheckCombo
                allLabel="Todos"
                items={[
                  { id: "ACTIVE",   label: "Activos" },
                  { id: "INACTIVE", label: "Inactivos" },
                ]}
                selected={expActiveOnly as Set<string> | null}
                onChange={(v) => setExpActiveOnly(v as Set<"ACTIVE" | "INACTIVE"> | null)}
              />
            </div>
          </div>
        )}

        {/* Lista */}
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
        ) : filteredExpenses.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center space-y-1">
            <p className="text-sm text-muted-foreground">Sin resultados para los filtros aplicados.</p>
            <button
              onClick={() => { setExpSearch(""); setExpFrequency(null); setExpActiveOnly(null); }}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {hasExpFilters && filteredExpenses.length < (expenses ?? []).length && (
              <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                <span>{filteredExpenses.length} de {(expenses ?? []).length} gastos</span>
                <button
                  onClick={() => { setExpSearch(""); setExpFrequency(null); setExpActiveOnly(null); }}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                  Limpiar filtros
                </button>
              </div>
            )}
            {filteredExpenses.map((e) => (
              <RecurringExpenseItem key={e.id} expense={e} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
