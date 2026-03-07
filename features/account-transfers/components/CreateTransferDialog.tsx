"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useCreateTransfer } from "../hooks/useCreateTransfer";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

type Props = {
  trigger?: React.ReactNode;
};

export function CreateTransferDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [transferredAt, setTransferredAt] = useState(today);
  const [description, setDescription] = useState("");

  const { data: accounts } = useAccounts({ status: "active" });
  const transfer = useCreateTransfer();

  const payableAccounts = (accounts ?? []).filter(
    (a) => a.type === "CASH" || a.type === "BANK" || a.type === "WALLET"
  );

  const fromAccount = payableAccounts.find((a) => a.id === Number(fromAccountId));
  const toAccount = payableAccounts.find((a) => a.id === Number(toAccountId));
  const toOptions = payableAccounts.filter((a) => a.id !== Number(fromAccountId));

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const hasEnoughBalance = !fromAccount || fromAccount.currentBalanceCents >= amountCents;
  const isValid = fromAccountId && toAccountId && amountCents > 0 && hasEnoughBalance;

  function reset() {
    setFromAccountId("");
    setToAccountId("");
    setAmount("");
    setTransferredAt(today);
    setDescription("");
  }

  async function handleSubmit() {
    if (!isValid) return;
    try {
      await transfer.mutateAsync({
        fromAccountId: Number(fromAccountId),
        toAccountId: Number(toAccountId),
        amountCents,
        transferredAt: new Date(transferredAt + "T12:00:00").toISOString(),
        description: description.trim() || undefined,
      });
      setOpen(false);
      reset();
    } catch {
      // error shown by hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Transferir
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva transferencia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Desde */}
          <div className="space-y-1.5">
            <Label>Desde</Label>
            <Select
              value={fromAccountId}
              onValueChange={(v) => {
                setFromAccountId(v);
                if (v === toAccountId) setToAccountId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Cuenta origen..." />
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
            {fromAccount && (
              <p className={`text-xs ${hasEnoughBalance ? "text-muted-foreground" : "text-destructive font-medium"}`}>
                Saldo: {formatCurrency(fromAccount.currentBalanceCents)}
                {!hasEnoughBalance && " — insuficiente"}
              </p>
            )}
          </div>

          {/* Hacia */}
          <div className="space-y-1.5">
            <Label>Hacia</Label>
            <Select value={toAccountId} onValueChange={setToAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Cuenta destino..." />
              </SelectTrigger>
              <SelectContent>
                {toOptions.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    <span>{a.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">
                      {formatCurrency(a.currentBalanceCents)}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Resumen visual */}
          {fromAccount && toAccount && (
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium truncate">{fromAccount.name}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium truncate">{toAccount.name}</span>
            </div>
          )}

          {/* Monto */}
          <div className="space-y-1.5">
            <Label htmlFor="transfer-amount">Monto</Label>
            <Input
              id="transfer-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="transfer-date">Fecha</Label>
            <Input
              id="transfer-date"
              type="date"
              value={transferredAt}
              onChange={(e) => setTransferredAt(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="transfer-desc">Descripción (opcional)</Label>
            <Input
              id="transfer-desc"
              placeholder="Ej: Ahorro mensual"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button disabled={!isValid || transfer.isPending} onClick={handleSubmit}>
              Transferir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
