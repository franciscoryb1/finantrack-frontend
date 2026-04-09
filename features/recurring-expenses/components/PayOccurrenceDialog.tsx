"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { getCardDotColor } from "@/features/credit-cards/components/CreditCardVisual";
import { formatCurrency } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

type Props = {
  occurrence: RecurringOccurrence;
  trigger?: React.ReactNode;
};

type Step = "form" | "confirm-update";
type PaymentMethod = "account" | "credit_card";

const INSTALLMENTS_OPTIONS = [1, 2, 3, 6, 9, 12, 18, 24];

export function PayOccurrenceDialog({ occurrence, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("account");
  const [amount, setAmount] = useState<number | undefined>(
    occurrence.recurringExpense.amountCents / 100
  );
  const [occurredAt, setOccurredAt] = useState<string>(() =>
    new Date().toLocaleDateString("en-CA", { timeZone: "America/Argentina/Buenos_Aires" })
  );
  const [occurredAtTime, setOccurredAtTime] = useState<string>(() =>
    new Date().toLocaleTimeString("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  );
  const [accountId, setAccountId] = useState<string>("");
  const [creditCardId, setCreditCardId] = useState<string>("");
  const [installmentsCount, setInstallmentsCount] = useState<string>("1");
  const [serverError, setServerError] = useState<string | null>(null);

  const pay = usePayRecurringExpense();
  const update = useUpdateRecurringExpense();
  const { data: allAccounts } = useAccounts();
  const { data: allCreditCards } = useCreditCards();

  const accounts = (allAccounts ?? []).filter((a) => a.type !== "CREDIT_CARD" && a.isActive);
  const creditCards = (allCreditCards ?? []).filter((c) => c.isActive);

  const estimatedCents = occurrence.recurringExpense.amountCents;

  function handleOpen(o: boolean) {
    if (!o) {
      setStep("form");
      setServerError(null);
    }
    setOpen(o);
  }

  function handleFormSubmit() {
    setServerError(null);
    if (!amount || amount <= 0) {
      setServerError("El monto debe ser mayor a 0");
      return;
    }
    if (paymentMethod === "account" && !accountId) {
      setServerError("Seleccioná una cuenta");
      return;
    }
    if (paymentMethod === "credit_card" && !creditCardId) {
      setServerError("Seleccioná una tarjeta de crédito");
      return;
    }

    const amountCents = Math.round(amount * 100);
    if (amountCents !== estimatedCents) {
      setStep("confirm-update");
    } else {
      submitPayment(false);
    }
  }

  async function submitPayment(updateEstimated: boolean) {
    setServerError(null);
    const amountCents = Math.round((amount ?? 0) * 100);
    const occurredAtIso = `${occurredAt}T${occurredAtTime}:00-03:00`;

    try {
      await pay.mutateAsync({
        id: occurrence.recurringExpense.id,
        data: {
          dueDate: occurrence.dueDate,
          amountCents,
          occurredAt: occurredAtIso,
          ...(paymentMethod === "account"
            ? { accountId: Number(accountId) }
            : {
                creditCardId: Number(creditCardId),
                installmentsCount: Number(installmentsCount),
              }),
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

      <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm">
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
            {/* Selector de método de pago */}
            <Tabs value={paymentMethod} onValueChange={(v) => {
              setPaymentMethod(v as PaymentMethod);
              setServerError(null);
            }}>
              <TabsList className="w-full">
                <TabsTrigger value="account" className="flex-1">Cuenta</TabsTrigger>
                <TabsTrigger value="credit_card" className="flex-1">Tarjeta de crédito</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-1.5">
              <Label htmlFor="pay-amount">Monto real ($)</Label>
              <CurrencyInput
                id="pay-amount"
                value={amount}
                onChange={setAmount}
              />
            </div>

            {paymentMethod === "account" ? (
              <div className="space-y-1.5">
                <Label htmlFor="pay-account">Cuenta</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger id="pay-account" className="w-full">
                    <SelectValue placeholder="¿De qué cuenta lo pagás?" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        <span>{a.name}</span>
                        <span className="ml-2 text-muted-foreground text-xs">
                          {formatCurrency(a.currentBalanceCents)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="pay-card">Tarjeta</Label>
                  <Select value={creditCardId} onValueChange={setCreditCardId}>
                    <SelectTrigger id="pay-card" className="w-full">
                      <SelectValue placeholder="¿Con qué tarjeta?" />
                    </SelectTrigger>
                    <SelectContent>
                      {creditCards.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: getCardDotColor(c.brand, c.backgroundColor) }}
                            />
                            {c.name}
                            <span className="text-muted-foreground text-xs">
                              ···{c.cardLast4}
                            </span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pay-installments">Cuotas</Label>
                  <Select value={installmentsCount} onValueChange={setInstallmentsCount}>
                    <SelectTrigger id="pay-installments" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTALLMENTS_OPTIONS.map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n === 1 ? "1 cuota (sin cuotas)" : `${n} cuotas`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label>Fecha de pago</Label>
              <div className="flex gap-2">
                <Input
                  id="pay-date"
                  type="date"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  className="flex-1"
                />
                <Input
                  id="pay-time"
                  type="time"
                  value={occurredAtTime}
                  onChange={(e) => setOccurredAtTime(e.target.value)}
                  className="w-28"
                />
              </div>
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
                  {formatCurrency(Math.round((amount ?? 0) * 100))}
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
