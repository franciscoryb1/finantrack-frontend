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

  const { data: creditCards } = useCreditCards();
  const { data: categories } = useCategories("EXPENSE");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Tarjeta */}
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
                <Input placeholder="Ej: Heladera, Notebook..." {...field} />
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
              <FormLabel>Monto total ($)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="0.00"
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

        {/* Fecha de compra */}
        <FormField
          control={form.control}
          name="occurredAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha de compra</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cuotas totales / Cuotas ya pagadas */}
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

        {/* Primer resumen: año y mes */}
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
                    <SelectTrigger>
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

        {/* Categoría */}
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

        <Button type="submit" className="w-full">
          Cargar compra
        </Button>
      </form>
    </Form>
  );
}
