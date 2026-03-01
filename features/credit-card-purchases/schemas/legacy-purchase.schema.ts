import { z } from "zod";

export const legacyPurchaseSchema = z
  .object({
    creditCardId: z.number(),
    categoryId: z.number().optional(),
    amount: z.number().positive("El monto debe ser positivo"),
    installmentsCount: z.number().int().min(2, "Mínimo 2 cuotas"),
    paidInstallmentsCount: z.number().int().min(0, "Mínimo 0"),
    occurredAt: z.string().min(1, "Ingresá la fecha"),
    description: z.string().optional(),
    firstStatementYear: z.number().int().min(2000).max(2100),
    firstStatementMonth: z.number().int().min(1).max(12),
  })
  .refine((data) => data.paidInstallmentsCount < data.installmentsCount, {
    message: "Debe ser menor al total de cuotas",
    path: ["paidInstallmentsCount"],
  });

export type LegacyPurchaseFormValues = z.infer<typeof legacyPurchaseSchema>;
