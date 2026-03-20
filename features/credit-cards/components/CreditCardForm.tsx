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
  { label: "Auto",    value: "",   swatch: "linear-gradient(135deg, #374151 0%, #111827 100%)" },
  { label: "Negro",   value: "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)",  swatch: "#111" },
  { label: "Azul",    value: "linear-gradient(135deg, #0d1b4b 0%, #1e3a8a 100%)",  swatch: "#1e3a8a" },
  { label: "Celeste", value: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)",  swatch: "#0284c7" },
  { label: "Verde",   value: "linear-gradient(135deg, #064e3b 0%, #059669 100%)",  swatch: "#059669" },
  { label: "Rojo",    value: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)",  swatch: "#b91c1c" },
  { label: "Morado",  value: "linear-gradient(135deg, #3b0764 0%, #7c3aed 100%)",  swatch: "#7c3aed" },
  { label: "Rosa",    value: "linear-gradient(135deg, #831843 0%, #db2777 100%)",  swatch: "#db2777" },
  { label: "Dorado",  value: "linear-gradient(135deg, #78350f 0%, #d97706 100%)",  swatch: "#d97706" },
  { label: "Naranja", value: "linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)",  swatch: "#ea580c" },
  { label: "Índigo",  value: "linear-gradient(135deg, #312e81 0%, #6366f1 100%)",  swatch: "#6366f1" },
  { label: "Gris",    value: "linear-gradient(135deg, #374151 0%, #6b7280 100%)",  swatch: "#6b7280" },
];

const BRAND_OPTIONS = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
] as const;

const MONTHS = [
  { value: 1,  label: "01 – Enero" },
  { value: 2,  label: "02 – Febrero" },
  { value: 3,  label: "03 – Marzo" },
  { value: 4,  label: "04 – Abril" },
  { value: 5,  label: "05 – Mayo" },
  { value: 6,  label: "06 – Junio" },
  { value: 7,  label: "07 – Julio" },
  { value: 8,  label: "08 – Agosto" },
  { value: 9,  label: "09 – Septiembre" },
  { value: 10, label: "10 – Octubre" },
  { value: 11, label: "11 – Noviembre" },
  { value: 12, label: "12 – Diciembre" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 16 }, (_, i) => CURRENT_YEAR + i);

// ── SectionLabel ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-3">
      {children}
    </p>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  defaultValues?: Partial<CreditCardFormValues>;
  onSubmit: (values: CreditCardFormValues) => Promise<void>;
  formId?: string;
};

export function CreditCardForm({ defaultValues, onSubmit, formId }: Props) {
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
      expiryYear: CURRENT_YEAR,
      isActive: true,
      backgroundColor: "",
      ...defaultValues,
    },
  });

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
    cardExpiresAt: new Date(watchedExpY || CURRENT_YEAR, (watchedExpM || 1) - 1, 1).toISOString(),
    isActive: true,
    backgroundColor: watchedColor || null,
    bankAccount: { id: 0, name: "" },
  };

  return (
    <Form {...form}>
      <form
        id={formId}
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-x-6 gap-y-0"
      >
        {/* ── Columna izquierda: visual ── */}
        <div className="sm:border-r sm:pr-6 pb-6 sm:pb-0 border-b sm:border-b-0 mb-6 sm:mb-0">
          {/* Preview */}
          <div className="pointer-events-none mb-5">
            <CreditCardVisual card={previewCard} backgroundColor={watchedColor || null} />
          </div>

          {/* Marca */}
          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="mb-5">
                <SectionLabel>Marca</SectionLabel>
                <FormControl>
                  <div className="grid grid-cols-2 gap-2">
                    {BRAND_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(opt.value)}
                        className={cn(
                          "rounded-lg border py-2.5 text-sm font-medium transition-colors",
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

          {/* Color */}
          <FormField
            control={form.control}
            name="backgroundColor"
            render={({ field }) => (
              <FormItem>
                <SectionLabel>Color</SectionLabel>
                <FormControl>
                  <div className="grid grid-cols-6 gap-2.5">
                    {COLOR_PRESETS.map((preset) => {
                      const isSelected = field.value === preset.value;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          title={preset.label}
                          onClick={() => field.onChange(preset.value)}
                          className={cn(
                            "relative w-8 h-8 rounded-full border-2 transition-all",
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
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-bold leading-none">
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
        </div>

        {/* ── Columna derecha: campos ── */}
        <div className="space-y-4">
          {/* Nombre */}
          <div>
            <SectionLabel>Datos de la tarjeta</SectionLabel>
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
          </div>

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
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="expiryMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mes venc.</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem key={m.value} value={m.value.toString()}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año venc.</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="AAAA" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-1 border-t">
            <SectionLabel>Cuenta y límite</SectionLabel>

            {/* Cuenta vinculada */}
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem className="mb-4">
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
          </div>
        </div>
      </form>
    </Form>
  );
}
