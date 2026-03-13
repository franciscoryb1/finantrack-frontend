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
import { cn } from "@/lib/utils";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { legacyPurchaseSchema, LegacyPurchaseFormValues } from "../schemas/legacy-purchase.schema";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type Props = {
  onSubmit: (values: LegacyPurchaseFormValues) => Promise<void>;
};

export function LegacyPurchaseForm({ onSubmit }: Props) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  const form = useForm<LegacyPurchaseFormValues>({
    resolver: zodResolver(legacyPurchaseSchema),
    defaultValues: {
      creditCardId: undefined,
      categoryId: undefined,
      amount: undefined,
      installmentsCount: 2,
      paidInstallmentsCount: 0,
      occurredAt: today,
      description: "",
      firstStatementYear: now.getFullYear(),
      firstStatementMonth: now.getMonth() + 1,
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

        {/* 2. Tarjeta */}
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

        {/* 3. Monto + Categoría + Subcategoría (misma fila en desktop) */}
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
                <Input placeholder="Ej: Heladera, Notebook..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 5. Cuotas totales + Ya pagadas */}
        <div className="grid grid-cols-2 gap-3">
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

          <FormField
            control={form.control}
            name="paidInstallmentsCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ya pagadas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
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

        {/* 6. Primer resumen: Año + Mes */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstStatementYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año 1° resumen</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={2000}
                    max={2100}
                    placeholder="2025"
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

          <FormField
            control={form.control}
            name="firstStatementMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mes 1° resumen</FormLabel>
                <Select
                  onValueChange={(val) => field.onChange(Number(val))}
                  value={field.value?.toString() ?? ""}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Mes..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MONTH_NAMES.map((name, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          Cargar compra
        </Button>
      </form>
    </Form>
  );
}
