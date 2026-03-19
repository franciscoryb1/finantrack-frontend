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
import { cn } from "@/lib/utils";
import { categorySchema, CategoryFormValues } from "../schemas/category.schema";
import { CategoryType } from "../api/categories.api";
import { ColorPicker } from "./ColorPicker";

const TYPE_OPTIONS: { value: CategoryType; label: string }[] = [
  { value: "EXPENSE", label: "Gasto" },
  { value: "INCOME", label: "Ingreso" },
];

type Props = {
  onSubmit: (values: CategoryFormValues) => Promise<void>;
  defaultValues?: Partial<CategoryFormValues>;
  submitLabel?: string;
  /** Si se pasa, es subcategoría: hereda el tipo del padre */
  parentType?: CategoryType;
};

export function CategoryForm({
  onSubmit,
  defaultValues,
  submitLabel = "Guardar",
  parentType,
}: Props) {
  const isSubcategory = !!parentType;

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type: parentType ?? "EXPENSE",
      color: null,
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Tipo — solo para categorías raíz */}
        {!isSubcategory && (
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    {TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
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

        {isSubcategory && (
          <p className="text-sm text-muted-foreground">
            Tipo heredado:{" "}
            <span className="font-medium">
              {parentType === "EXPENSE" ? "Gasto" : "Ingreso"}
            </span>
          </p>
        )}

        {/* Nombre + color en la misma fila */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <div className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field: colorField }) => (
                      <ColorPicker
                        value={colorField.value}
                        onChange={colorField.onChange}
                      />
                    )}
                  />
                  <Input
                    placeholder="Ej: Alimentación, Transporte..."
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
