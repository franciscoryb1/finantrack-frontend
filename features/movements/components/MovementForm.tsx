"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { movementSchema, MovementFormValues } from "../schemas/movement.schema";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";

type Props = {
  onSubmit: (values: MovementFormValues) => Promise<void>;
};

export function MovementForm({ onSubmit }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const form = useForm<MovementFormValues>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: "EXPENSE",
      amount: undefined,
      description: "",
      categoryId: undefined,
      occurredAt: today,
      paymentMethod: "ACCOUNT",
      accountId: undefined,
      creditCardId: undefined,
      installmentsCount: 1,
    },
  });

  const selectedType = form.watch("type");
  const selectedPaymentMethod = form.watch("paymentMethod");

  const { data: categories } = useCategories(selectedType);
  const { data: allAccounts } = useAccounts();
  const { data: creditCards } = useCreditCards();

  const accounts = (allAccounts ?? []).filter(
    (a) => a.type !== "CREDIT_CARD" && a.isActive
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Tipo: Gasto / Ingreso */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  {(["EXPENSE", "INCOME"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        field.onChange(t);
                        form.setValue("categoryId", undefined);
                        // Los ingresos siempre van a una cuenta, no a tarjeta
                        if (t === "INCOME") {
                          form.setValue("paymentMethod", "ACCOUNT");
                          form.setValue("creditCardId", undefined);
                          form.setValue("installmentsCount", undefined);
                        }
                      }}
                      className={cn(
                        "rounded-lg border py-2 text-sm font-medium transition-colors",
                        field.value === t
                          ? t === "EXPENSE"
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-green-600 text-white border-green-600"
                          : "bg-background text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {t === "EXPENSE" ? "Gasto" : "Ingreso"}
                    </button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monto */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : Number(e.target.value)
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Descripción */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Descripción{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Ej: Supermercado, Sueldo..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Categoría — filtrada por tipo */}
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Categoría{" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value?.toString() ?? ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Método de pago — solo para Gasto */}
        {selectedType === "EXPENSE" && (
          <FormField
            control={form.control}
            name="paymentMethod"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Método de pago</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "ACCOUNT", label: "Efectivo / Cuenta" },
                      { value: "CREDIT_CARD", label: "Tarjeta de crédito" },
                    ] as const).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          field.onChange(opt.value);
                          form.setValue("accountId", undefined);
                          form.setValue("creditCardId", undefined);
                          form.setValue("installmentsCount", opt.value === "CREDIT_CARD" ? 1 : undefined);
                        }}
                        className={cn(
                          "rounded-lg border py-2 text-sm font-medium transition-colors",
                          field.value === opt.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Cuenta — cuando método es ACCOUNT */}
        {selectedPaymentMethod === "ACCOUNT" && (
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() ?? ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar cuenta..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accounts.map((a) => (
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
        )}

        {/* Tarjeta + Cuotas — cuando método es CREDIT_CARD */}
        {selectedPaymentMethod === "CREDIT_CARD" && (
          <>
            <FormField
              control={form.control}
              name="creditCardId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarjeta</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value?.toString() ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tarjeta..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(creditCards ?? [])
                        .filter((c) => c.isActive)
                        .map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.name}
                            {c.brand ? ` · ${c.brand}` : ""}
                            {` ···· ${c.cardLast4}`}
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
              name="installmentsCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuotas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="1"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? undefined : Number(e.target.value)
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Fecha */}
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

        <Button type="submit" className="w-full">
          Guardar
        </Button>
      </form>
    </Form>
  );
}
