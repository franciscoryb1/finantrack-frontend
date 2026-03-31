"use client";

import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  recurringExpenseSchema,
  RecurringExpenseFormValues,
  FREQUENCY_LABELS,
  DAY_OF_WEEK_OPTIONS,
} from "../schemas/recurring-expense.schema";
import { useCategories } from "@/features/categories/hooks/useCategories";

type Props = {
  onSubmit: (values: RecurringExpenseFormValues) => Promise<void>;
  defaultValues?: Partial<RecurringExpenseFormValues>;
  initialParentCategoryId?: number;
  submitLabel?: string;
  formId?: string;
  onDirtyChange?: (dirty: boolean) => void;
};

export function RecurringExpenseForm({
  onSubmit,
  defaultValues,
  initialParentCategoryId,
  submitLabel = "Guardar",
  formId,
  onDirtyChange,
}: Props) {
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<RecurringExpenseFormValues>({
    resolver: zodResolver(recurringExpenseSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: undefined,
      frequency: "MONTHLY",
      dueDay: undefined,
      dueDayOfWeek: undefined,
      startDate: today,
      endDate: "",
      categoryId: undefined,
      ...defaultValues,
    },
  });

  const { isDirty } = form.formState;
  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);

  const selectedFrequency = form.watch("frequency");
  const isMonthly = selectedFrequency === "MONTHLY";
  const isWeeklyOrBiweekly = selectedFrequency === "WEEKLY" || selectedFrequency === "BIWEEKLY";

  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(initialParentCategoryId);
  const { data: categories } = useCategories("EXPENSE");
  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];
  const watchedCategoryId = form.watch("categoryId");

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">

        {/* Nombre — fila completa */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Alquiler, Luz Edenor, Internet…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monto hero — fila completa */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="rounded-xl border-2 border-muted-foreground/20  px-4 py-3 transition-colors focus-within:border-muted-foreground/40">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Monto estimado
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-bold shrink-0 text-foreground">$</span>
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

        {/* Grid principal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">

          {/* Frecuencia */}
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecuencia</FormLabel>
                <Select
                  onValueChange={(val) => {
                    field.onChange(val);
                    if (val !== "MONTHLY") form.setValue("dueDay", undefined);
                    if (val === "MONTHLY") form.setValue("dueDayOfWeek", undefined);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["WEEKLY", "BIWEEKLY", "MONTHLY"] as const).map((f) => (
                      <SelectItem key={f} value={f}>
                        {FREQUENCY_LABELS[f]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Día de vencimiento (MONTHLY) o Día de semana (WEEKLY/BIWEEKLY) — misma columna */}
          {isMonthly && (
            <FormField
              control={form.control}
              name="dueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Día del mes{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="Ej: 10"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                        }
                        className="pr-28"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                        de cada mes
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {isWeeklyOrBiweekly && (
            <FormField
              control={form.control}
              name="dueDayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Día de la semana{" "}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value?.toString() ?? ""}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Ej: todos los lunes" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {DAY_OF_WEEK_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value.toString()}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Fecha de inicio */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de inicio</FormLabel>
                <FormControl>
                  <Input type="date" className="w-full" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de fin */}
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Fecha de fin{" "}
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

          {/* Categoría */}
          <div className={subCategories.length > 0 ? undefined : "sm:col-span-2"}>
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

          {/* Subcategoría */}
          {subCategories.length > 0 && (
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
          )}

          {/* Descripción — fila completa */}
          <div className="sm:col-span-2">
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
                    <Input placeholder="Notas adicionales…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

        </div>

        {!formId && (
          <Button type="submit" className="w-full" size="lg">
            {submitLabel}
          </Button>
        )}
      </form>
    </Form>
  );
}
