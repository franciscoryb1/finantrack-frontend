"use client";

import { useState } from "react";
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
import { CurrencyInput } from "@/components/ui/currency-input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { movementSchema, MovementFormValues } from "../schemas/movement.schema";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { TagPicker } from "@/features/tags/components/TagPicker";

type Props = {
  onSubmit: (values: MovementFormValues) => Promise<void>;
  defaultValues?: Partial<MovementFormValues>;
  initialParentCategoryId?: number;
  submitLabel?: string;
  onReimbursementChange?: (enabled: boolean) => void;
};

export function MovementForm({ onSubmit, defaultValues, initialParentCategoryId, submitLabel = "Guardar", onReimbursementChange }: Props) {
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
      tagIds: [],
      accountId: undefined,
      creditCardId: undefined,
      installmentsCount: 1,
      reimbursementEnabled: false,
      reimbursementAmount: undefined,
      reimbursementAccountId: undefined,
      reimbursementAt: today,
      ...defaultValues,
    },
  });

  const selectedType = form.watch("type");
  const selectedPaymentMethod = form.watch("paymentMethod");
  const watchedCategoryId = form.watch("categoryId");
  const reimbursementEnabled = form.watch("reimbursementEnabled");

  const showReimbursementPanel =
    selectedType === "EXPENSE" &&
    selectedPaymentMethod === "CREDIT_CARD" &&
    !!reimbursementEnabled;

  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(initialParentCategoryId);

  const { data: categories } = useCategories(selectedType);
  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];

  const { data: allAccounts } = useAccounts();
  const { data: creditCards } = useCreditCards();
  const accounts = (allAccounts ?? []).filter((a) => a.type !== "CREDIT_CARD" && a.isActive);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Columns wrapper — flex-row on desktop when reimbursement panel is open */}
        <div className={cn(
          "flex flex-col gap-5",
          showReimbursementPanel && "sm:flex-row sm:gap-6 sm:items-start"
        )}>

          {/* Left column: all regular fields + reimbursement toggle */}
          <div className={cn("flex flex-col gap-5", showReimbursementPanel && "sm:flex-1")}>

            {/* 1. Fecha */}
            <FormField
              control={form.control}
              name="occurredAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input type="date" className="w-full" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 2. Tipo */}
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
                            setParentCategoryId(undefined);
                            if (t === "INCOME") {
                              form.setValue("paymentMethod", "ACCOUNT");
                              form.setValue("creditCardId", undefined);
                              form.setValue("installmentsCount", undefined);
                              form.setValue("reimbursementEnabled", false);
                              onReimbursementChange?.(false);
                            }
                          }}
                          className={cn(
                            "rounded-lg border py-2.5 text-sm font-medium transition-colors",
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

            {/* 3. Monto + Categoría + Subcategoría */}
            <div className={cn(
              "grid gap-3",
              subCategories.length > 0
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2"
            )}>
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto ($)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      onValueChange={(val) => {
                        const id = Number(val);
                        setParentCategoryId(id);
                        field.onChange(id);
                      }}
                      value={parentCategoryId?.toString() ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
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

              {subCategories.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label>
                    Subcategoría{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Select
                    onValueChange={(val) =>
                      form.setValue("categoryId", Number(val), { shouldValidate: true })
                    }
                    value={
                      subCategories.some((c) => c.id === watchedCategoryId)
                        ? watchedCategoryId?.toString() ?? ""
                        : ""
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sin subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {subCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* 4. Descripción */}
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

            {/* 5. Etiquetas */}
            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Etiquetas{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <TagPicker
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 6. Medio de pago — solo para Gasto */}
            {selectedType === "EXPENSE" && (
              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medio de pago</FormLabel>
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
                              form.setValue(
                                "installmentsCount",
                                opt.value === "CREDIT_CARD" ? 1 : undefined
                              );
                              if (opt.value === "ACCOUNT") {
                                form.setValue("reimbursementEnabled", false);
                                onReimbursementChange?.(false);
                              }
                            }}
                            className={cn(
                              "rounded-lg border py-2.5 text-sm font-medium transition-colors",
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

            {/* 6a. Cuenta */}
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
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccionar cuenta..." />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 6b. Tarjeta + Cuotas */}
            {selectedPaymentMethod === "CREDIT_CARD" && (
              <div className="grid grid-cols-[1fr_auto] gap-3 items-start">
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
                          <SelectTrigger className="w-full">
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
                    <FormItem className="w-24">
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
              </div>
            )}

            {/* Reintegro toggle — solo para Gasto con tarjeta */}
            {selectedType === "EXPENSE" && selectedPaymentMethod === "CREDIT_CARD" && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <FormField
                  control={form.control}
                  name="reimbursementEnabled"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-sm font-medium">Tiene reintegro</FormLabel>
                          <p className="text-xs text-muted-foreground">Ej: cashback de banco o promoción</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value ?? false}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              onReimbursementChange?.(checked);
                              if (!checked) {
                                form.setValue("reimbursementAmount", undefined);
                                form.setValue("reimbursementAccountId", undefined);
                                form.setValue("reimbursementAt", today);
                              }
                            }}
                          />
                        </FormControl>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

          </div>{/* end left column */}

          {/* Right column: reimbursement fields — flows below on mobile, beside on desktop */}
          {showReimbursementPanel && (
            <div className="flex flex-col gap-4 sm:w-56 sm:border-l sm:pl-5 sm:pt-0">
              <p className="text-sm font-medium hidden sm:block">Datos del reintegro</p>

              <FormField
                control={form.control}
                name="reimbursementAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto del reintegro ($)</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={(val) => field.onChange(val)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reimbursementAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Fecha de acreditación{" "}
                      <span className="text-muted-foreground font-normal">(opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        className="w-full"
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reimbursementAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cuenta de acreditación</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={field.value?.toString() ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="¿En qué cuenta te acreditan?" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

        </div>{/* end columns wrapper */}

        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
