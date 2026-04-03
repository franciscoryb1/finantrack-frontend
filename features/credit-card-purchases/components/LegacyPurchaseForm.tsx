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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { getCardDotColor } from "@/features/credit-cards/components/CreditCardVisual";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { legacyPurchaseSchema, LegacyPurchaseFormValues } from "../schemas/legacy-purchase.schema";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

/** Genera opciones "YYYY-MM" desde 1 mes adelante hasta 5 años atrás. */
function buildMonthOptions(): { value: string; label: string }[] {
  const now = new Date();
  const baseYear = now.getFullYear();
  const baseMonth = now.getMonth() + 1; // 1-12

  const options: { value: string; label: string }[] = [];

  for (let delta = 1; delta >= -(5 * 12); delta--) {
    // aritmética entera — sin new Date("..."), sin riesgo de timezone
    const totalMonths = baseYear * 12 + (baseMonth - 1) + delta;
    const year = Math.floor(totalMonths / 12);
    const month = (totalMonths % 12) + 1;
    const value = `${year}-${String(month).padStart(2, "0")}`;
    options.push({ value, label: `${MONTH_NAMES[month - 1]} ${year}` });
  }

  return options;
}

const MONTH_OPTIONS = buildMonthOptions();

type Props = {
  onSubmit: (values: LegacyPurchaseFormValues) => Promise<void>;
  creditCardId?: number;
};

export function LegacyPurchaseForm({ onSubmit, creditCardId }: Props) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const form = useForm<LegacyPurchaseFormValues>({
    resolver: zodResolver(legacyPurchaseSchema),
    defaultValues: {
      creditCardId: creditCardId,
      categoryId: undefined,
      amount: undefined,
      installmentsCount: 2,
      occurredAt: today,
      description: "",
      firstStatement: undefined,
    },
  });

  const watchedCategoryId = form.watch("categoryId");
  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>();

  const { data: creditCards } = useCreditCards();
  const { data: categories } = useCategories("EXPENSE");

  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">

        {/* 1. Fecha de compra */}
        <FormField
          control={form.control}
          name="occurredAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de compra</FormLabel>
              <FormControl>
                <Input type="date" className="w-full" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 2. Tarjeta (ocultar si viene pre-seleccionada) */}
        {!creditCardId && (
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
                          <span className="flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: getCardDotColor(c.brand, c.backgroundColor) }}
                            />
                            {c.name}
                            {c.brand ? ` · ${c.brand}` : ""}
                            {` ···· ${c.cardLast4}`}
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

        {/* 3. Monto + Cuotas totales */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto total ($)</FormLabel>
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
            name="installmentsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuotas totales</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2}
                    placeholder="12"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 4. Primer resumen */}
        <FormField
          control={form.control}
          name="firstStatement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mes del primer resumen</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="¿En qué mes apareció la cuota 1?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MONTH_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 5. Categoría + Subcategoría */}
        <div className={`grid gap-3 ${subCategories.length > 0 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
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

          {subCategories.length > 0 && (
            <div className="min-w-0">
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
        </div>

        {/* 6. Descripción */}
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
                <Input placeholder="Ej: Heladera, Notebook..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          Cargar compra
        </Button>
      </form>
    </Form>
  );
}
