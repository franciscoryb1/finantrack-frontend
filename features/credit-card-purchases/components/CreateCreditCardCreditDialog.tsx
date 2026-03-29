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

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CreateCreditCardCreditDialog({ creditCardId }: { creditCardId: number }) {
  const [open, setOpen] = useState(false);
  const createCredit = useCreateCreditCardCredit();
  const { data: categories } = useCategories("EXPENSE");

  const flatCategories = (categories ?? []).flatMap(cat => [
    { id: cat.id, label: cat.name },
    ...cat.children.map(child => ({ id: child.id, label: `${cat.name} › ${child.name}` })),
  ]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: undefined,
      description: "",
      occurredAt: todayISO(),
      categoryId: undefined,
    },
  });

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
      form.reset({ amount: undefined, description: "", occurredAt: todayISO(), categoryId: undefined });
    } catch {
      // el toast de error lo muestra el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                  <Select
                    value={field.value?.toString() ?? ""}
                    onValueChange={(v) => field.onChange(v ? Number(v) : undefined)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sin categoría" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {flatCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
