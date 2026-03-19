"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import {
  useRegisterMovementReimbursement,
  useRegisterPurchaseReimbursement,
} from "../hooks/useRegisterReimbursement";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({
  accountId: z.number({ error: "Seleccioná una cuenta" }),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  occurredAt: z.string().min(1, "Ingresá la fecha"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "movement" | "purchase";
  sourceId: number;
  sharedAmountCents: number;
  receivedAmountCents: number;
  pendingAmountCents: number;
  expenseDescription: string | null;
};

export function RegisterReimbursementDialog({
  open,
  onOpenChange,
  kind,
  sourceId,
  sharedAmountCents,
  receivedAmountCents,
  pendingAmountCents,
  expenseDescription,
}: Props) {
  const { data: accounts = [] } = useAccounts({ status: "active" });
  const selectableAccounts = accounts.filter((a) => a.type !== "CREDIT_CARD");

  const registerMovement = useRegisterMovementReimbursement();
  const registerPurchase = useRegisterPurchaseReimbursement();
  const mutation = kind === "movement" ? registerMovement : registerPurchase;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: pendingAmountCents / 100,
      occurredAt: todayStr,
      description: expenseDescription ? `Reintegro - ${expenseDescription}` : "Reintegro",
    },
  });

  async function onSubmit(values: FormValues) {
    const input = {
      accountId: values.accountId,
      amountCents: Math.round(values.amount * 100),
      occurredAt: new Date(
        parseInt(values.occurredAt.split("-")[0]),
        parseInt(values.occurredAt.split("-")[1]) - 1,
        parseInt(values.occurredAt.split("-")[2]),
        12, 0, 0
      ).toISOString(),
      description: values.description || undefined,
    };

    if (kind === "movement") {
      await registerMovement.mutateAsync({ movementId: sourceId, input });
    } else {
      await registerPurchase.mutateAsync({ purchaseId: sourceId, input });
    }

    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar reintegro</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 border p-3 grid grid-cols-3 gap-2 text-center text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Compartido</p>
            <p className="font-semibold tabular-nums">{formatCurrency(sharedAmountCents)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Recibido</p>
            <p className="font-semibold tabular-nums text-green-600 dark:text-green-400">{formatCurrency(receivedAmountCents)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendiente</p>
            <p className="font-semibold tabular-nums text-amber-600 dark:text-amber-400">{formatCurrency(pendingAmountCents)}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta donde entra</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccioná una cuenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectableAccounts.map((a) => (
                        <SelectItem key={a.id} value={a.id.toString()}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max={pendingAmountCents / 100}
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción <span className="text-muted-foreground">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Reintegro..." {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Registrando..." : "Registrar reintegro"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
