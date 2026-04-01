"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Undo2 } from "lucide-react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreateCreditCardCredit } from "../hooks/useCreateCreditCardCredit";

const schema = z.object({
  amount: z.number({ message: "Ingresá un monto" }).positive("El monto debe ser mayor a 0"),
  description: z.string().optional(),
  occurredAt: z.string().min(1, "Ingresá una fecha"),
  categoryId: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Helpers de fecha ──────────────────────────────────────────────────────────

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "yyyy-MM-dd" → "dd/MM/yyyy" */
function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** "dd/MM/yyyy" → "yyyy-MM-dd" (vacío si incompleto) */
function displayToISO(display: string): string {
  const digits = display.replace(/\D/g, "");
  if (digits.length < 8) return "";
  const d = digits.slice(0, 2);
  const m = digits.slice(2, 4);
  const y = digits.slice(4, 8);
  return `${y}-${m}-${d}`;
}

/** Aplica la máscara dd/MM/yyyy mientras el usuario escribe */
function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CreateCreditCardCreditDialog({ creditCardId }: { creditCardId: number }) {
  const [open, setOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState(isoToDisplay(todayISO()));
  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(undefined);

  const createCredit = useCreateCreditCardCredit();
  const { data: categories } = useCategories("EXPENSE");

  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined,
      description: "",
      occurredAt: todayISO(),
      categoryId: undefined,
    },
  });

  const watchedCategoryId = form.watch("categoryId");

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyDateMask(e.target.value);
    setDisplayDate(masked);
    const iso = displayToISO(masked);
    if (iso) form.setValue("occurredAt", iso, { shouldValidate: true });
  }

  function resetForm() {
    const today = todayISO();
    form.reset({ amount: undefined, description: "", occurredAt: today, categoryId: undefined });
    setDisplayDate(isoToDisplay(today));
    setParentCategoryId(undefined);
  }

  async function onSubmit(values: FormValues) {
    const [y, m, d] = values.occurredAt.split("-").map(Number);
    const occurredAt = new Date(y, m - 1, d, 12, 0, 0).toISOString();
    try {
      await createCredit.mutateAsync({
        creditCardId,
        amountCents: Math.round(values.amount * 100),
        occurredAt,
        description: values.description || undefined,
        categoryId: values.categoryId,
      });
      setOpen(false);
      resetForm();
    } catch {
      // el toast de error lo muestra el hook
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o) resetForm();
    setOpen(o);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Undo2 className="h-4 w-4 mr-1.5" />
          Registrar devolución
        </Button>
      </DialogTrigger>

      <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar devolución</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-1">

            {/* Monto */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto devuelto</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0,00"
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
                  <FormLabel>Descripción <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Devolución compra electrónica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha dd/MM/yyyy */}
            <FormField
              control={form.control}
              name="occurredAt"
              render={() => (
                <FormItem>
                  <FormLabel>Fecha</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      placeholder="dd/MM/aaaa"
                      value={displayDate}
                      onChange={handleDateChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoría + Subcategoría en grid */}
            <div className={`grid gap-3 ${subCategories.length > 0 ? "grid-cols-2" : "grid-cols-1"}`}>
              <div className="min-w-0">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoría <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                    <Select
                      value={parentCategoryId?.toString() ?? ""}
                      onValueChange={(v) => {
                        const id = Number(v);
                        setParentCategoryId(id);
                        field.onChange(id);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
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

              {/* Subcategoría — aparece a la derecha si la categoría padre tiene hijos */}
              {subCategories.length > 0 && (
                <div className="min-w-0">
                <FormItem>
                  <FormLabel>Subcategoría <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                  <Select
                    value={
                      subCategories.some((c) => c.id === watchedCategoryId)
                        ? watchedCategoryId?.toString() ?? ""
                        : ""
                    }
                    onValueChange={(v) =>
                      form.setValue("categoryId", Number(v), { shouldValidate: true })
                    }
                  >
                    <SelectTrigger className="w-full overflow-hidden">
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

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCredit.isPending}>
                {createCredit.isPending ? "Guardando..." : "Guardar devolución"}
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
