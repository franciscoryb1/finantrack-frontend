"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { StatementExtra } from "@/features/installments/api/getCardPeriodDetail";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statementId: number;
  totalCents: number;
  extras: StatementExtra[];
  cardId: number;
  cardName: string;
  periodYear: number;
  periodMonth: number;
};

export function PayStatementDialog({
  open,
  onOpenChange,
  statementId,
  totalCents,
  extras,
  cardId,
  cardName,
  periodYear,
  periodMonth,
}: Props) {
  const now = new Date();
  const today = now.toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" });
  const defaultDescription = `Pago ${cardName} - ${MONTHS[periodMonth - 1]} ${periodYear}`;

  const [accountId, setAccountId] = useState("");
  const [paidAt, setPaidAt] = useState(today);
  const [paidAtTime, setPaidAtTime] = useState(() =>
    now.toLocaleTimeString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
  const [description, setDescription] = useState(defaultDescription);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: accounts } = useAccounts({ status: "active" });
  const payMutation = usePayStatement(cardId);

  const payableAccounts = (accounts ?? []).filter(
    (a) => a.type === "CASH" || a.type === "BANK" || a.type === "WALLET"
  );

  const extrasTotalCents = extras.reduce((sum, e) => sum + e.amountCents, 0);
  const grandTotalCents = totalCents + extrasTotalCents;

  const selectedAccount = payableAccounts.find((a) => a.id === Number(accountId));
  const hasEnoughBalance = !selectedAccount || selectedAccount.currentBalanceCents >= grandTotalCents;

  function reset() {
    setAccountId("");
    setPaidAt(today);
    setPaidAtTime(
      new Date().toLocaleTimeString("en-CA", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
    setDescription(defaultDescription);
  }

  const canPay = !!accountId && hasEnoughBalance && grandTotalCents > 0;

  const handlePay = async () => {
    if (!canPay) return;
    try {
      await payMutation.mutateAsync({
        statementId,
        accountId: Number(accountId),
        paidAt: `${paidAt}T${paidAtTime}:00-03:00`,
        description: description.trim() || undefined,
      });
      setConfirmOpen(false);
      onOpenChange(false);
      reset();
    } catch {
      // error shown by hook
    }
  };

  function handleOpenChange(o: boolean) {
    if (!o) reset();
    onOpenChange(o);
  }

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:w-[672px]">
        <DialogHeader>
          <DialogTitle>Pagar resumen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">

          {/* Totales */}
          <div className="rounded-lg bg-muted p-3 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cuotas y consumos</span>
              <span className="tabular-nums">{formatCurrency(totalCents)}</span>
            </div>
            {extras.map((e) => (
              <div key={e.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[60%]">{e.description}</span>
                <span className={`tabular-nums ${e.amountCents < 0 ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                  {e.amountCents < 0 ? "-" : "+"}{formatCurrency(Math.abs(e.amountCents))}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold border-t pt-1.5 mt-1">
              <span>Total a pagar</span>
              <span className="text-lg tabular-nums">{formatCurrency(grandTotalCents)}</span>
            </div>
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
              <p className={`text-xs ${hasEnoughBalance ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                Saldo disponible: {formatCurrency(selectedAccount.currentBalanceCents)}
                {!hasEnoughBalance && " — saldo insuficiente"}
              </p>
            )}
          </div>

          {/* Fecha y hora */}
          <div className="space-y-1.5">
            <Label>Fecha de pago</Label>
            <div className="flex gap-2">
              <Input
                id="paid-at"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="flex-1"
              />
              <Input
                id="paid-at-time"
                type="time"
                value={paidAtTime}
                onChange={(e) => setPaidAtTime(e.target.value)}
                className="w-28"
              />
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="pay-description">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></Label>
            <Input
              id="pay-description"
              placeholder="Ej: Pago resumen enero"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button disabled={!canPay || payMutation.isPending} onClick={() => setConfirmOpen(true)}>
              Confirmar pago
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmar pago?</AlertDialogTitle>
          <AlertDialogDescription>
            Confirmá el pago de la tarjeta <strong>{cardName}</strong> para el período{" "}
            <strong>{MONTHS[periodMonth - 1]} {periodYear}</strong> por{" "}
            <strong>{formatCurrency(grandTotalCents)}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={payMutation.isPending} onClick={handlePay}>
            {payMutation.isPending ? "Procesando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
