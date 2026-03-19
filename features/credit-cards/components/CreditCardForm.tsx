"use client";

import { useForm, useWatch } from "react-hook-form";
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
import { cn, formatCurrency } from "@/lib/utils";
import { Check } from "lucide-react";

import {
  creditCardSchema,
  CreditCardFormValues,
} from "../schemas/schema";

import { useBankAccounts } from "@/features/accounts/hooks/useBankAccounts";
import { CreditCardVisual } from "./CreditCardVisual";
import { CreditCard } from "../api/credit-cards.api";

// ── Colores predefinidos ───────────────────────────────────────────────────────

const COLOR_PRESETS: { label: string; value: string; swatch: string }[] = [
  { label: "Auto",     value: "",     swatch: "linear-gradient(135deg, #374151 0%, #111827 100%)" },
  { label: "Negro",    value: "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)",   swatch: "#111" },
  { label: "Azul",     value: "linear-gradient(135deg, #0d1b4b 0%, #1e3a8a 100%)",   swatch: "#1e3a8a" },
  { label: "Celeste",  value: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)",   swatch: "#0284c7" },
  { label: "Verde",    value: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",   swatch: "#059669" },
  { label: "Rojo",     value: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)",   swatch: "#b91c1c" },
  { label: "Morado",   value: "linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)",   swatch: "#7c3aed" },
  { label: "Rosa",     value: "linear-gradient(135deg, #831843 0%, #db2777 100%)",   swatch: "#db2777" },
  { label: "Dorado",   value: "linear-gradient(135deg, #78350f 0%, #d97706 100%)",   swatch: "#d97706" },
  { label: "Naranja",  value: "linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)",   swatch: "#ea580c" },
  { label: "Índigo",   value: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)",   swatch: "#6366f1" },
  { label: "Gris",     value: "linear-gradient(135deg, #374151 0%, #6b7280 100%)",   swatch: "#6b7280" },
];

// ── Constantes ────────────────────────────────────────────────────────────────

const BRAND_OPTIONS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
] as const;

type Props = {
  defaultValues?: Partial<CreditCardFormValues>;
  onSubmit: (values: CreditCardFormValues) => Promise<void>;
  submitLabel: string;
};

export function CreditCardForm({ defaultValues, onSubmit, submitLabel }: Props) {
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
      backgroundColor: "",
      ...defaultValues,
    },
  });

  // Valores observados para el preview
  const [watchedName, watchedBrand, watchedLast4, watchedExpM, watchedExpY, watchedColor] =
    useWatch({
      control: form.control,
      name: ["name", "brand", "cardLast4", "expiryMonth", "expiryYear", "backgroundColor"],
    });

  const previewCard: CreditCard = {
    id: 0,
    name: watchedName || "Mi Tarjeta",
    brand: watchedBrand ?? null,
    limitCents: 0,
    closingDay: 1,
    dueDay: 1,
    cardLast4: String(watchedLast4 ?? "").length === 4 ? String(watchedLast4) : "0000",
    cardExpiresAt: new Date(watchedExpY || 2026, (watchedExpM || 1) - 1, 1).toISOString(),
    isActive: true,
    backgroundColor: watchedColor || null,
    bankAccount: { id: 0, name: "" },
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Preview ── */}
        <div className="w-full max-w-xs mx-auto pointer-events-none">
          <CreditCardVisual card={previewCard} backgroundColor={watchedColor || null} />
        </div>

        {/* ── Nombre ── */}
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

        {/* ── Marca ── */}
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

        {/* ── Color ── */}
        <FormField
          control={form.control}
          name="backgroundColor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <FormControl>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PRESETS.map((preset) => {
                    const isSelected = field.value === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        title={preset.label}
                        onClick={() => field.onChange(preset.value)}
                        className={cn(
                          "relative w-7 h-7 rounded-full border-2 transition-all",
                          isSelected
                            ? "border-foreground scale-110 shadow-md"
                            : "border-transparent hover:scale-105 hover:border-muted-foreground/40",
                        )}
                        style={{ background: preset.swatch }}
                      >
                        {isSelected && (
                          <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
                        )}
                        {preset.value === "" && !isSelected && (
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-bold leading-none">
                            Auto
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Cuenta vinculada ── */}
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
                      <span>{acc.name}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {formatCurrency(acc.currentBalanceCents)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* ── Límite ── */}
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

        {/* ── Últimos 4 dígitos ── */}
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

        {/* ── Vencimiento ── */}
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
                      field.onChange(e.target.value === "" ? "" : Number(e.target.value))
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
                      field.onChange(e.target.value === "" ? "" : Number(e.target.value))
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
