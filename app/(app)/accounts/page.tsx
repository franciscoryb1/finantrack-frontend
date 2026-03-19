"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { AccountItem, TYPE_CONFIG } from "@/features/accounts/components/AccountItem";
import { CreateAccountDialog } from "@/features/accounts/components/CreateAccountDialog";
import { CreateTransferDialog } from "@/features/account-transfers/components/CreateTransferDialog";
import { Account, AccountType } from "@/features/accounts/api/accounts.api";
import { formatCurrency } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp, ArrowLeftRight } from "lucide-react";

// ── Orden de grupos ───────────────────────────────────────────────────────────

const GROUP_ORDER: AccountType[] = ["BANK", "WALLET", "CASH"];

// ── Balance total ─────────────────────────────────────────────────────────────

function TotalBalanceCard({ accounts }: { accounts: Account[] }) {
  const active = accounts.filter((a) => a.isActive);
  const total = active.reduce((s, a) => s + a.currentBalanceCents, 0);

  return (
    <div className="rounded-2xl bg-primary p-5 text-primary-foreground flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium opacity-80">Balance total</p>
        <p className="text-2xl sm:text-3xl font-bold tabular-nums mt-1 break-all">
          {formatCurrency(total)}
        </p>
        <p className="text-xs opacity-60 mt-1">
          {active.length} {active.length === 1 ? "cuenta activa" : "cuentas activas"}
        </p>
      </div>
      <TrendingUp className="h-10 w-10 opacity-20 shrink-0" />
    </div>
  );
}

// ── Grupo por tipo ────────────────────────────────────────────────────────────

function AccountGroup({ type, accounts }: { type: AccountType; accounts: Account[] }) {
  const cfg = TYPE_CONFIG[type];
  const Icon = cfg.Icon;
  const subtotal = accounts
    .filter((a) => a.isActive)
    .reduce((s, a) => s + a.currentBalanceCents, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: cfg.bg }}
          >
            <Icon className="h-3.5 w-3.5" style={{ color: cfg.color }} />
          </div>
          <span className="text-sm font-semibold">{cfg.label}</span>
          <span className="text-xs text-muted-foreground">({accounts.length})</span>
        </div>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground">
          {formatCurrency(subtotal)}
        </span>
      </div>

      <div className="space-y-2">
        {accounts.map((account) => (
          <AccountItem key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  useEffect(() => { document.title = "Cuentas | Finantrack"; }, []);

  const [includeInactive, setIncludeInactive] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: accounts = [], isLoading, error } = useAccounts({
    status: includeInactive ? "all" : "active",
  });

  const groups = useMemo(() => {
    return GROUP_ORDER
      .map((type) => ({ type, accounts: accounts.filter((a) => a.type === type) }))
      .filter((g) => g.accounts.length > 0);
  }, [accounts]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Mis cuentas</h1>
        <div className="flex items-center gap-2">
          <CreateTransferDialog
            trigger={
              <Button variant="outline" size="sm">
                <ArrowLeftRight className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Transferir</span>
              </Button>
            }
          />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Nueva cuenta</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        <p className="text-destructive text-sm">Error al cargar cuentas.</p>
      ) : (
        <>
          <TotalBalanceCard accounts={accounts} />

          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={includeInactive}
              onCheckedChange={setIncludeInactive}
            />
            <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
              Mostrar inactivas
            </Label>
          </div>

          {groups.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No tenés cuentas creadas todavía.
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map(({ type, accounts }) => (
                <AccountGroup key={type} type={type} accounts={accounts} />
              ))}
            </div>
          )}
        </>
      )}

      <CreateAccountDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
