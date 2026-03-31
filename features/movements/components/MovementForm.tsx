"use client";

import { useState, useEffect } from "react";
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
import { CreditCard, Users, Tag } from "lucide-react";

type Props = {
  onSubmit: (values: MovementFormValues) => Promise<void>;
  defaultValues?: Partial<MovementFormValues>;
  initialParentCategoryId?: number;
  submitLabel?: string;
  formId?: string;
  onDirtyChange?: (dirty: boolean) => void;
  hidePaymentMethod?: boolean;
};

export function MovementForm({
  onSubmit,
  defaultValues,
  initialParentCategoryId,
  submitLabel = "Guardar movimiento",
  formId,
  onDirtyChange,
  hidePaymentMethod = false,
}: Props) {
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
      sharedExpenseEnabled: false,
      sharedAmount: undefined,
      sharedReimbursementAccountId: undefined,
      ...defaultValues,
    },
  });

  const { isDirty } = form.formState;
  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(
    initialParentCategoryId
  );
  const [showTags, setShowTags] = useState(() => !!(defaultValues?.tagIds?.length));

  const selectedType = form.watch("type");
  const selectedPaymentMethod = form.watch("paymentMethod");
  const watchedCategoryId = form.watch("categoryId");
  const watchedAmount = form.watch("amount");
  const reimbursementEnabled = form.watch("reimbursementEnabled");
  const sharedExpenseEnabled = form.watch("sharedExpenseEnabled");
  const watchedSharedAmount = form.watch("sharedAmount");

  const { data: categories } = useCategories(selectedType);
  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];

  const { data: allAccounts } = useAccounts();
  const { data: creditCards } = useCreditCards();
  const accounts = (allAccounts ?? []).filter((a) => a.type !== "CREDIT_CARD" && a.isActive);

  const isExpense = selectedType === "EXPENSE";
  const isCreditCard = selectedPaymentMethod === "CREDIT_CARD";

  // ── Render helpers ────────────────────────────────────────────────────────

  function renderAccountSelect(name: "accountId" | "reimbursementAccountId" | "sharedReimbursementAccountId", placeholder: string, label: string) {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              onValueChange={(val) => field.onChange(Number(val))}
              value={field.value?.toString() ?? ""}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={placeholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>
                    <span className="flex items-center justify-between gap-3">
                      <span>{a.name}</span>
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {formatCurrency(a.currentBalanceCents)}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // ──────────────────────────────────────────────────────────────────────────

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* ── Tipo (full width) ── */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
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
                          form.setValue("sharedExpenseEnabled", false);
                          form.setValue("sharedAmount", undefined);
                          form.setValue("sharedReimbursementAccountId", undefined);
                        }
                      }}
                      className={cn(
                        "rounded-lg border py-2.5 text-sm font-semibold transition-all",
                        field.value === t
                          ? t === "EXPENSE"
                            ? "bg-red-600 text-white border-red-600 shadow-sm"
                            : "bg-green-600 text-white border-green-600 shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {t === "EXPENSE" ? "Gasto" : "Ingreso"}
                    </button>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* ── Cuerpo: grid 3 columnas en desktop ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-4">

          {/* Monto hero — fila completa */}
          <div className="sm:col-span-3">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className={cn(
                      "rounded-xl border-2 px-4 py-3 transition-colors",
                      isExpense
                        ? "border-red-600 dark:border-red-900"
                        : "border-green-600 dark:border-green-900"
                    )}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Monto
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className={cn(
                          "text-2xl font-bold shrink-0",
                          isExpense ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                        )}>
                          $
                        </span>
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0,00"
                          className="text-2xl font-bold bg-transparent dark:bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto flex-1"
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Fecha — col 1 */}
          <div className="sm:col-span-1">
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
          </div>

          {/* Categoría — col 2 (1 col si hay subcat, 2 cols si no) */}
          <div className={subCategories.length > 0 ? "sm:col-span-1" : "sm:col-span-2"}>
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
                          <span className="flex items-center gap-1.5">
                            {c.color && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: c.color }}
                              />
                            )}
                            {c.name}
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

          {/* Subcategoría — col 3, solo si existe */}
          {subCategories.length > 0 && (
            <div className="sm:col-span-1">
              <FormItem>
                <FormLabel>
                  Subcategoría{" "}
                  <span className="text-muted-foreground font-normal">(opcional)</span>
                </FormLabel>
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
                        <span className="flex items-center gap-1.5">
                          {c.color && (
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: c.color }}
                            />
                          )}
                          {c.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            </div>
          )}

          {/* Descripción — fila completa */}
          <div className="sm:col-span-3">
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
                    <Input placeholder="Ej: Supermercado, Sueldo…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Etiquetas — fila completa */}
          <div className="sm:col-span-3">
            {!showTags ? (
              <button
                type="button"
                onClick={() => setShowTags(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Tag className="h-3.5 w-3.5" />
                Agregar etiquetas
              </button>
            ) : (
              <FormField
                control={form.control}
                name="tagIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" />
                      Etiquetas
                    </FormLabel>
                    <FormControl>
                      <TagPicker value={field.value ?? []} onChange={field.onChange} defaultOpen={!defaultValues?.tagIds?.length} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Medio de pago — fila completa, solo EXPENSE y no edit */}
          {isExpense && !hidePaymentMethod && (
            <div className="sm:col-span-3">
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
                              }
                            }}
                            className={cn(
                              "rounded-lg border py-2.5 text-sm font-medium transition-all",
                              field.value === opt.value
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background text-muted-foreground border-border hover:bg-muted"
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
            </div>
          )}

          {/* Cuenta — fila completa */}
          {selectedPaymentMethod === "ACCOUNT" && (
            <div className="sm:col-span-3">
              {renderAccountSelect("accountId", "Seleccionar cuenta…", "Cuenta")}
            </div>
          )}

          {/* Tarjeta — 2 cols, Cuotas — 1 col */}
          {isCreditCard && (
            <>
              <div className="sm:col-span-2">
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
                            <SelectValue placeholder="Seleccionar…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(creditCards ?? [])
                            .filter((c) => c.isActive)
                            .map((c) => (
                              <SelectItem key={c.id} value={c.id.toString()}>
                                {c.name} ···· {c.cardLast4}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="sm:col-span-1">
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
              </div>
            </>
          )}

          {/* Reintegro — fila completa, solo EXPENSE + CREDIT_CARD */}
          {isExpense && isCreditCard && (
            <div className="sm:col-span-3">
              <div className={cn(
                "rounded-xl border overflow-hidden transition-colors",
                reimbursementEnabled ? "border-border" : "border-border/60 bg-muted/20"
              )}>
                <FormField
                  control={form.control}
                  name="reimbursementEnabled"
                  render={({ field }) => {
                    function toggle() {
                      const next = !field.value;
                      field.onChange(next);
                      if (!next) {
                        form.setValue("reimbursementAmount", undefined);
                        form.setValue("reimbursementAccountId", undefined);
                        form.setValue("reimbursementAt", today);
                      }
                    }
                    return (
                      <div className="flex w-full items-center justify-between px-3 py-2.5">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left"
                          onClick={toggle}
                        >
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium leading-none">Tiene reintegro</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Cashback o promoción</p>
                          </div>
                        </button>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={toggle}
                        />
                      </div>
                    );
                  }}
                />
                {reimbursementEnabled && (
                  <div className="px-3 pb-3 pt-2 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="reimbursementAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Monto ($)</FormLabel>
                            <FormControl>
                              <CurrencyInput value={field.value} onChange={field.onChange} />
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
                            <FormLabel className="text-xs">Fecha</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {renderAccountSelect(
                      "reimbursementAccountId",
                      "¿En qué cuenta?",
                      "Cuenta de acreditación"
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gasto compartido — fila completa, solo EXPENSE */}
          {isExpense && (
            <div className="sm:col-span-3">
              <div className={cn(
                "rounded-xl border overflow-hidden transition-colors",
                sharedExpenseEnabled ? "border-border" : "border-border/60 bg-muted/20"
              )}>
                <FormField
                  control={form.control}
                  name="sharedExpenseEnabled"
                  render={({ field }) => {
                    function toggle() {
                      const next = !field.value;
                      field.onChange(next);
                      if (!next) {
                        form.setValue("sharedAmount", undefined);
                        form.setValue("sharedReimbursementAccountId", undefined);
                      }
                    }
                    return (
                      <div className="flex w-full items-center justify-between px-3 py-2.5">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left"
                          onClick={toggle}
                        >
                          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div>
                            <p className="text-sm font-medium leading-none">Gasto compartido</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">Parte lo pagan otras personas</p>
                          </div>
                        </button>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={toggle}
                        />
                      </div>
                    );
                  }}
                />
                {sharedExpenseEnabled && (
                  <div className="px-3 pb-3 pt-2 border-t space-y-3">
                    <FormField
                      control={form.control}
                      name="sharedAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">¿Cuánto te devuelven? ($)</FormLabel>
                          <FormControl>
                            <CurrencyInput
                              value={field.value}
                              onChange={field.onChange}
                              max={watchedAmount}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {renderAccountSelect(
                      "sharedReimbursementAccountId",
                      "Seleccionar cuenta…",
                      "¿En qué cuenta entra el dinero?"
                    )}
                    {watchedSharedAmount && watchedAmount && (
                      <div className="flex items-center justify-between text-xs rounded-lg bg-muted/50 px-3 py-2">
                        <span className="text-muted-foreground">Tu parte del gasto</span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(
                            Math.round((watchedAmount - watchedSharedAmount) * 100)
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ── Submit (solo si no hay formId externo) ── */}
        {!formId && (
          <Button type="submit" className="w-full" size="lg">
            {submitLabel}
          </Button>
        )}

      </form>
    </Form>
  );
}
