"use client";

import { useState } from "react";
import { Account, AccountType } from "../api/accounts.api";
import { useToggleAccount } from "../hooks/useToggleAccount";
import { useUpdateAccount } from "../hooks/useUpdateAccount";
import { useDeleteAccount } from "../hooks/useDeleteAccount";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { formatCurrency, cn } from "@/lib/utils";
import { Wallet, Building2, Smartphone, Pencil, Check, X, Trash2 } from "lucide-react";

// ── Config por tipo ───────────────────────────────────────────────────────────

export const TYPE_CONFIG: Record<
  AccountType,
  { label: string; Icon: React.ElementType; color: string; bg: string }
> = {
  BANK:        { label: "Bancaria",          Icon: Building2,  color: "#3b82f6", bg: "#eff6ff" },
  WALLET:      { label: "Billetera virtual",  Icon: Smartphone, color: "#8b5cf6", bg: "#f5f3ff" },
  CASH:        { label: "Efectivo",           Icon: Wallet,     color: "#22c55e", bg: "#f0fdf4" },
  CREDIT_CARD: { label: "Tarjeta de crédito", Icon: Wallet,     color: "#f97316", bg: "#fff7ed" },
};

// ── AccountItem ───────────────────────────────────────────────────────────────

type Props = { account: Account };

export function AccountItem({ account }: Props) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(account.name);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggle = useToggleAccount();
  const update = useUpdateAccount();
  const deleteAccount = useDeleteAccount();

  const cfg = TYPE_CONFIG[account.type];
  const Icon = cfg.Icon;

  async function handleSave() {
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === account.name) { setEditing(false); return; }
    await update.mutateAsync({ id: account.id, name: trimmed });
    setEditing(false);
  }

  function handleToggleClick() {
    if (account.isActive) setConfirmDeactivate(true);
    else toggle.mutate({ id: account.id, activate: true });
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border bg-card transition-opacity",
          !account.isActive && "opacity-50"
        )}
        style={{ borderLeftWidth: 3, borderLeftColor: cfg.color }}
      >
        {/* Ícono */}
        <div
          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: cfg.bg }}
        >
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
        </div>

        {/* Nombre + tipo */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="h-7 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") { setNameInput(account.name); setEditing(false); }
                }}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSave} disabled={update.isPending}>
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setNameInput(account.name); setEditing(false); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <p className="font-semibold text-sm truncate">{account.name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{cfg.label}</p>
        </div>

        {/* Balance */}
        <div className="text-right shrink-0">
          <p className="font-bold tabular-nums">
            {formatCurrency(account.currentBalanceCents)}
          </p>
          {!account.isActive && (
            <p className="text-[10px] text-muted-foreground">Inactiva</p>
          )}
        </div>

        {/* Acciones */}
        {!editing && (
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              title="Renombrar"
              onClick={() => { setNameInput(account.name); setEditing(true); }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
              title="Eliminar"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="sm" className="h-7 text-xs"
              disabled={toggle.isPending}
              onClick={handleToggleClick}
            >
              {account.isActive ? "Desactivar" : "Activar"}
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={confirmDeactivate} onOpenChange={(o) => { if (!o) setConfirmDeactivate(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar "{account.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              La cuenta quedará inactiva y no podrá usarse en nuevos movimientos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmDeactivate(false); toggle.mutate({ id: account.id, activate: false }); }}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(false); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar "{account.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y no se puede deshacer. Los movimientos asociados a esta cuenta podrían verse afectados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setConfirmDelete(false); deleteAccount.mutate(account.id); }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
