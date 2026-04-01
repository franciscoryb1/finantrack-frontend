"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  const [occStatusFilter, setOccStatusFilter] = useState<OccurrenceStatus | "ALL">("ALL");

  // ── Filtros — Gastos configurados ──────────────────────────────────────────
  const [expSearch,     setExpSearch]     = useState("");
  const [expFrequency,  setExpFrequency]  = useState<RecurringFrequency | "ALL">("ALL");
  const [expActiveOnly, setExpActiveOnly] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

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
    if (occStatusFilter !== "ALL") {
      items = items.filter((o) => o.status === occStatusFilter);
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
    if (expActiveOnly === "ACTIVE")   items = items.filter((e) => e.isActive);
    if (expActiveOnly === "INACTIVE") items = items.filter((e) => !e.isActive);
    if (expFrequency !== "ALL")       items = items.filter((e) => e.frequency === expFrequency);
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
  const hasExpFilters = expFrequency !== "ALL" || expActiveOnly !== "ALL" || expSearch.trim();

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
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pagado</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(paidTotal)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{paid.length} ítem{paid.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pendiente</p>
              <p className={cn("text-lg font-bold", pendingTotal > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>{formatCurrency(pendingTotal)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{pendingCount} ítem{pendingCount !== 1 ? "s" : ""}</p>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total período</p>
              <p className="text-lg font-bold">{formatCurrency(periodTotal)}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{allOccurrences.length} ítem{allOccurrences.length !== 1 ? "s" : ""}</p>
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
              {overdue.length > 0 && (
                <FilterChip variant="overdue" active={occStatusFilter === "OVERDUE"} onClick={() => setOccStatusFilter("OVERDUE")}>
                  Vencidos ({overdue.length})
                </FilterChip>
              )}
              {pending.length > 0 && (
                <FilterChip variant="pending" active={occStatusFilter === "PENDING"} onClick={() => setOccStatusFilter("PENDING")}>
                  Pendientes ({pending.length})
                </FilterChip>
              )}
              {paid.length > 0 && (
                <FilterChip variant="paid" active={occStatusFilter === "PAID"} onClick={() => setOccStatusFilter("PAID")}>
                  Pagados ({paid.length})
                </FilterChip>
              )}
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

            {/* Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-2">
              {/* Frecuencia */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide shrink-0">Frecuencia</span>
                <div className="flex items-center gap-1 flex-wrap">
                  <FilterChip active={expFrequency === "ALL"} onClick={() => setExpFrequency("ALL")}>Todas</FilterChip>
                  {(["MONTHLY", "BIWEEKLY", "WEEKLY"] as RecurringFrequency[]).map((f) => (
                    <FilterChip key={f} active={expFrequency === f} onClick={() => setExpFrequency(f)}>
                      {FREQUENCY_LABEL[f]}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wide shrink-0">Estado</span>
                <div className="flex items-center gap-1">
                  <FilterChip active={expActiveOnly === "ALL"}      onClick={() => setExpActiveOnly("ALL")}>Todos</FilterChip>
                  <FilterChip active={expActiveOnly === "ACTIVE"}   onClick={() => setExpActiveOnly("ACTIVE")}>Activos</FilterChip>
                  <FilterChip active={expActiveOnly === "INACTIVE"} onClick={() => setExpActiveOnly("INACTIVE")}>Inactivos</FilterChip>
                </div>
              </div>
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
              onClick={() => { setExpSearch(""); setExpFrequency("ALL"); setExpActiveOnly("ALL"); }}
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
                  onClick={() => { setExpSearch(""); setExpFrequency("ALL"); setExpActiveOnly("ALL"); }}
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
