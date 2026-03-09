"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePayRecurringExpense } from "../hooks/usePayRecurringExpense";
import { useUpdateRecurringExpense } from "../hooks/useUpdateRecurringExpense";
import { RecurringOccurrence } from "../api/recurring-expenses.api";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { formatCurrency } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

type Props = {
  occurrence: RecurringOccurrence;
  trigger?: React.ReactNode;
};

type Step = "form" | "confirm-update";

export function PayOccurrenceDialog({ occurrence, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState<string>(
    (occurrence.recurringExpense.amountCents / 100).toFixed(2)
  );
  const [occurredAt, setOccurredAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [accountId, setAccountId] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);

  const pay = usePayRecurringExpense();
  const update = useUpdateRecurringExpense();
  const { data: allAccounts } = useAccounts();
  const accounts = (allAccounts ?? []).filter((a) => a.type !== "CREDIT_CARD" && a.isActive);

  const estimatedCents = occurrence.recurringExpense.amountCents;

  function handleOpen(o: boolean) {
    if (!o) {
      setStep("form");
      setServerError(null);
    }
    setOpen(o);
  }

  // Validación del formulario antes de confirmar
  function handleFormSubmit() {
    setServerError(null);
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setServerError("El monto debe ser mayor a 0");
      return;
    }
    if (!accountId) {
      setServerError("Seleccioná una cuenta");
      return;
    }

    const amountCents = Math.round(amountNum * 100);
    // Si el monto difiere del estimado, preguntar
    if (amountCents !== estimatedCents) {
      setStep("confirm-update");
    } else {
      submitPayment(false);
    }
  }

  async function submitPayment(updateEstimated: boolean) {
    setServerError(null);
    const amountCents = Math.round(parseFloat(amount) * 100);
    const [y, m, d] = occurredAt.split("-").map(Number);
    const occurredAtIso = new Date(y, m - 1, d, 12, 0, 0).toISOString();

    try {
      await pay.mutateAsync({
        id: occurrence.recurringExpense.id,
        data: {
          dueDate: occurrence.dueDate,
          amountCents,
          occurredAt: occurredAtIso,
          accountId: Number(accountId),
        },
      });

      if (updateEstimated) {
        await update.mutateAsync({
          id: occurrence.recurringExpense.id,
          data: { amountCents },
        });
      }

      setOpen(false);
    } catch (e) {
      setStep("form");
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  const isPending = pay.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            Registrar pago
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
        </DialogHeader>

        {/* Info del gasto */}
        <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-0.5">
          <p className="text-sm font-medium">{occurrence.recurringExpense.name}</p>
          <p className="text-xs text-muted-foreground">
            Estimado: {formatCurrency(estimatedCents)}
          </p>
        </div>

        {serverError && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            {serverError}
          </p>
        )}

        {/* ── Paso 1: formulario ── */}
        {step === "form" && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Monto real ($)</Label>
              <Input
                id="pay-amount"
                type="number"
                min={0}
                step={0.01}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-account">Cuenta</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="pay-account" className="w-full">
                  <SelectValue placeholder="¿De qué cuenta lo pagás?" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id.toString()}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-date">Fecha de pago</Label>
              <Input
                id="pay-date"
                type="date"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleFormSubmit}>
                Confirmar pago
              </Button>
            </div>
          </div>
        )}

        {/* ── Paso 2: confirmar actualización del estimado ── */}
        {step === "confirm-update" && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 space-y-1">
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Monto diferente al estimado
                </p>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Ingresaste{" "}
                <span className="font-semibold">
                  {formatCurrency(Math.round(parseFloat(amount) * 100))}
                </span>{" "}
                pero el estimado es{" "}
                <span className="font-semibold">{formatCurrency(estimatedCents)}</span>.
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                ¿Querés actualizar el monto estimado del gasto fijo para los próximos períodos?
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => submitPayment(true)}
                disabled={isPending}
              >
                {isPending ? "Registrando..." : "Sí, actualizar estimado"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => submitPayment(false)}
                disabled={isPending}
              >
                No, solo registrar este pago
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => setStep("form")}
                disabled={isPending}
              >
                ← Volver a editar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
