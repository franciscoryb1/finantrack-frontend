import { z } from "zod";

export const movementSchema = z
  .object({
    type: z.enum(["INCOME", "EXPENSE"]),
    amount: z.number().positive("Debe ser mayor a 0"),
    description: z.string().optional(),
    categoryId: z.number().optional(),
    occurredAt: z.string().min(1, "Seleccionar una fecha"),
    paymentMethod: z.enum(["ACCOUNT", "CREDIT_CARD"]),
    // Campos condicionales según paymentMethod
    accountId: z.number().optional(),
    creditCardId: z.number().optional(),
    installmentsCount: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMethod === "ACCOUNT") {
      if (!data.accountId || data.accountId < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccionar una cuenta",
          path: ["accountId"],
        });
      }
    }

    if (data.paymentMethod === "CREDIT_CARD") {
      if (!data.creditCardId || data.creditCardId < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccionar una tarjeta",
          path: ["creditCardId"],
        });
      }
      if (!data.installmentsCount || data.installmentsCount < 1) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresá la cantidad de cuotas",
          path: ["installmentsCount"],
        });
      }
    }
  });

export type MovementFormValues = z.infer<typeof movementSchema>;
