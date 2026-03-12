"use client";

import { useMemo, useState } from "react";
import { useMovements } from "@/features/movements/hooks/useMovements";
import { useMovementsSummary } from "@/features/movements/hooks/useMovementsSummary";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { MovementsTable } from "@/features/movements/components/MovementsTable";
import { CreateMovementDialog } from "@/features/movements/components/CreateMovementDialog";
import { KpiCard } from "@/features/movements/components/KpiCard";
import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";
import { Movement, MovementType } from "@/features/movements/api/movements.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toActivityItem(m: Movement): DashboardActivityItem {
  return {
    kind: "MOVEMENT",
    id: m.id,
    type: m.type,
    amountCents: m.amountCents,
    description: m.description,
    occurredAt: m.occurredAt,
    purchaseDate: null,
    registeredAt: m.occurredAt,
    isRecurring: !!m.recurringPayment,
    tags: m.tags ?? [],
    account: m.account,
    creditCard: null,
    installmentInfo: null,
    transferData: null,
    category: m.category
      ? { id: m.category.id, name: m.category.name, color: m.category.color, parent: m.category.parent ?? null }
      : null,
  };
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function MovementsPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [typeFilter, setTypeFilter] = useState<"ALL" | MovementType>("ALL");
  const [accountId, setAccountId] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const fromDate = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
  const toDate = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  const { data: movementsData, isLoading } = useMovements({
    fromDate,
    toDate,
    type: typeFilter === "ALL" ? undefined : typeFilter,
    accountId,
    pageSize: 500,
  });

  const { data: summary, isLoading: summaryLoading } = useMovementsSummary({
    fromDate,
    toDate,
    accountId,
  });

  const { data: accounts = [] } = useAccounts({ status: "active" });
  const selectableAccounts = accounts.filter((a) => a.type !== "CREDIT_CARD");

  const allItems = useMemo(
    () => (movementsData?.items ?? []).map(toActivityItem),
    [movementsData],
  );

  const filteredItems = useMemo(() => {
    if (!search.trim()) return allItems;
    const q = search.toLowerCase();
    return allItems.filter(
      (item) =>
        item.description?.toLowerCase().includes(q) ||
        item.account?.name.toLowerCase().includes(q) ||
        item.category?.name.toLowerCase().includes(q),
    );
  }, [allItems, search]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Movimientos</h1>
        <CreateMovementDialog />
      </div>

      {/* Selector de período */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold min-w-44 text-center">
          {MONTHS[month - 1]} {year}
        </span>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          title="Ingresos"
          value={formatCurrency(summary?.totalIncomeCents ?? 0)}
          icon={TrendingUp}
          trend="positive"
          loading={summaryLoading}
        />
        <KpiCard
          title="Gastos"
          value={formatCurrency(summary?.totalExpenseCents ?? 0)}
          icon={TrendingDown}
          trend="negative"
          loading={summaryLoading}
        />
        <KpiCard
          title="Balance neto"
          value={formatCurrency(summary?.netBalanceCents ?? 0)}
          icon={Minus}
          trend={(summary?.netBalanceCents ?? 0) >= 0 ? "positive" : "negative"}
          loading={summaryLoading}
        />
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar por descripción, cuenta o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as "ALL" | MovementType)}
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos</SelectItem>
            <SelectItem value="INCOME">Ingresos</SelectItem>
            <SelectItem value="EXPENSE">Gastos</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={accountId?.toString() ?? "ALL"}
          onValueChange={(v) => setAccountId(v === "ALL" ? undefined : Number(v))}
        >
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Todas las cuentas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las cuentas</SelectItem>
            {selectableAccounts.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <MovementsTable items={filteredItems} loading={isLoading} />
    </div>
  );
}
