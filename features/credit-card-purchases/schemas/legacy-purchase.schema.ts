import { z } from "zod";

export const legacyPurchaseSchema = z.object({
  creditCardId: z.number(),
  categoryId: z.number().optional(),
  amount: z.number().positive("El monto debe ser positivo"),
  installmentsCount: z.number().int().min(2, "Mínimo 2 cuotas"),
  occurredAt: z.string().min(1, "Ingresá la fecha"),
  description: z.string().optional(),
  // "YYYY-MM" — primer mes en que aparece en un resumen
  firstStatement: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Seleccioná el mes"),
});

export type LegacyPurchaseFormValues = z.infer<typeof legacyPurchaseSchema>;

/**
 * Calcula cuántas cuotas ya fueron pagadas a partir del primer resumen.
 * Usa aritmética de enteros pura — sin parseo de fechas.
 */
export function computePaidInstallments(
  firstYear: number,
  firstMonth: number,
  installmentsCount: number,
): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12, hora local
  const monthsElapsed = (currentYear - firstYear) * 12 + (currentMonth - firstMonth);
  return Math.min(Math.max(0, monthsElapsed), installmentsCount - 1);
}
