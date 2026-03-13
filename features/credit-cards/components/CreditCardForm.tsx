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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import {
  creditCardSchema,
  CreditCardFormValues,
} from "../schemas/schema";

import { useBankAccounts } from "@/features/accounts/hooks/useBankAccounts";

const BRAND_OPTIONS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
] as const;

const ACCOUNT_TYPE_LABEL: Record<"BANK" | "WALLET", string> = {
  BANK: "Bancaria",
  WALLET: "Billetera",
};

type Props = {
  defaultValues?: Partial<CreditCardFormValues>;
  onSubmit: (values: CreditCardFormValues) => Promise<void>;
  submitLabel: string;
};

export function CreditCardForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: Props) {
  const { data: accounts } = useBankAccounts();

  const form = useForm<CreditCardFormValues>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: "",
      brand: "VISA",
      bankAccountId: 0,
      limit: 0,
      cardLast4: "",
      expiryMonth: 1,
      expiryYear: new Date().getFullYear(),
      isActive: true,
      ...defaultValues,
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
                <Input placeholder="Ej: Visa Galicia, Black BBVA..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Marca — toggle buttons */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <FormControl>
                <div className="grid grid-cols-2 gap-2">
                  {BRAND_OPTIONS.map((opt) => (
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

        {/* Cuenta vinculada */}
        <FormField
          control={form.control}
          name="bankAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cuenta vinculada</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                value={field.value ? field.value.toString() : ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id.toString()}>
                      {acc.name}
                      <span className="ml-1 text-muted-foreground">
                        · {ACCOUNT_TYPE_LABEL[acc.type]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Límite */}
        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Límite ($)</FormLabel>
              <FormControl>
                <CurrencyInput
                  value={field.value}
                  onChange={(val) => field.onChange(val ?? 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Últimos 4 dígitos */}
        <FormField
          control={form.control}
          name="cardLast4"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Últimos 4 dígitos</FormLabel>
              <FormControl>
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="1234"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Vencimiento */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="expiryMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mes de vencimiento</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={12}
                    placeholder="MM"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expiryYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Año de vencimiento</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="AAAA"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
