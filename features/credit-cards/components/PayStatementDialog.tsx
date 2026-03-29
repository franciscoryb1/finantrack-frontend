"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { usePayStatement } from "../hooks/usePayStatement";
import { formatCurrency } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementId: number;
  totalCents: number;
  cardId: number;
};

export function PayStatementDialog({
  open,
  onOpenChange,
  statementId,
  totalCents,
  cardId,
}: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const [accountId, setAccountId] = useState("");
  const [paidAt, setPaidAt] = useState(today);
  const [description, setDescription] = useState("");

  const { data: accounts } = useAccounts({ status: "active" });
  const payMutation = usePayStatement(cardId);

  const payableAccounts = (accounts ?? []).filter(
    (a) => a.type === "CASH" || a.type === "BANK" || a.type === "WALLET"
  );

  const selectedAccount = payableAccounts.find(
    (a) => a.id === Number(accountId)
  );

  const hasEnoughBalance =
    !selectedAccount ||
    selectedAccount.currentBalanceCents >= totalCents;

  const handlePay = async () => {
    if (!accountId) return;
    try {
      await payMutation.mutateAsync({
        statementId,
        accountId: Number(accountId),
        paidAt: paidAt
          ? new Date(paidAt + "T12:00:00").toISOString()
          : undefined,
        description: description.trim() || undefined,
      });
      onOpenChange(false);
      setAccountId("");
      setPaidAt(today);
      setDescription("");
    } catch {
      // error shown by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pagar resumen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Total */}
          <div className="rounded-lg bg-muted p-3 text-center">
            <p className="text-xs text-muted-foreground mb-0.5">Total a pagar</p>
            <p className="text-2xl font-bold">{formatCurrency(totalCents)}</p>
          </div>

          {/* Cuenta */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-account">Cuenta de débito</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="pay-account">
                <SelectValue placeholder="Seleccionar cuenta..." />
              </SelectTrigger>
              <SelectContent>
                {payableAccounts.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <span>{a.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">
                      {formatCurrency(a.currentBalanceCents)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedAccount && (
              <p
                className={`text-xs ${
                  hasEnoughBalance
                    ? "text-muted-foreground"
                    : "text-destructive font-medium"
                }`}
              >
                Saldo disponible: {formatCurrency(selectedAccount.currentBalanceCents)}
                {!hasEnoughBalance && " — saldo insuficiente"}
              </p>
            )}
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="paid-at">Fecha de pago</Label>
            <Input
              id="paid-at"
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-description">Descripción (opcional)</Label>
            <Input
              id="pay-description"
              placeholder="Ej: Pago resumen enero"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!accountId || !hasEnoughBalance || payMutation.isPending}
              onClick={handlePay}
            >
              {payMutation.isPending ? "Procesando..." : "Confirmar pago"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
