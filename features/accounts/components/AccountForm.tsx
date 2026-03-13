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
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { accountSchema, AccountFormValues } from "../schemas/account.schema";

type AccountTypeOption = {
  value: "CASH" | "BANK" | "WALLET";
  label: string;
};

const ACCOUNT_TYPES: AccountTypeOption[] = [
  { value: "CASH", label: "Efectivo" },
  { value: "BANK", label: "Cuenta bancaria" },
  { value: "WALLET", label: "Billetera virtual" },
];

type Props = {
  onSubmit: (values: AccountFormValues) => Promise<void>;
};

export function AccountForm({ onSubmit }: Props) {
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "BANK",
      currentBalance: undefined,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

        {/* Nombre */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Cuenta corriente, Efectivo..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <FormControl>
                <div className="grid grid-cols-3 gap-2">
                  {ACCOUNT_TYPES.map((opt) => (
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

        {/* Saldo inicial */}
        <FormField
          control={form.control}
          name="currentBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Saldo inicial ($){" "}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </FormLabel>
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

        <Button type="submit" className="w-full">
          Crear cuenta
        </Button>
      </form>
    </Form>
  );
}
