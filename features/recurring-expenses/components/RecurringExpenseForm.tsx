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
  submitLabel?: string;
  formId?: string;
  onDirtyChange?: (dirty: boolean) => void;
};

export function RecurringExpenseForm({
  onSubmit,
  defaultValues,
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
  const isWeekly = selectedFrequency === "WEEKLY" || selectedFrequency === "BIWEEKLY";

  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(undefined);

  const { data: categories } = useCategories("EXPENSE");
  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];
  const watchedCategoryId = form.watch("categoryId");

  return (
    <Form {...form}>
      <form id={formId} onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* Nombre */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Alquiler, Luz Edenor, Internet..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Monto + Frecuencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto estimado ($)</FormLabel>
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
                      <SelectValue placeholder="Seleccionar..." />
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
        </div>

        {/* Día de vencimiento — solo para MONTHLY */}
        {isMonthly && (
          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Día de vencimiento{" "}
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
                <p className="text-xs text-muted-foreground">
                  Si no especificás, se usa el día de la fecha de inicio.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Día de la semana — solo para WEEKLY / BIWEEKLY */}
        {isWeekly && (
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
                <p className="text-xs text-muted-foreground">
                  Si no especificás, se usa el día de la fecha de inicio.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Fecha inicio + Fecha fin */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-hidden [&>*]:min-w-0">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de inicio</FormLabel>
                <FormControl>
                  <Input type="date" className="w-full max-w-full" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    className="w-full max-w-full"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Categoría */}
        <div className={subCategories.length > 0 ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : undefined}>
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
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        </div>

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
                <Input placeholder="Notas adicionales..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!formId && (
          <Button type="submit" className="w-full">
            {submitLabel}
          </Button>
        )}
      </form>
    </Form>
  );
}
