import { z } from "zod";

const baseShape = {
  type: z.enum(["INCOME", "EXPENSE"]),
  amount: z.number().positive("Debe ser mayor a 0"),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  occurredAt: z.string().min(1, "Seleccionar una fecha"),
  occurredAtTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM"),
  paymentMethod: z.enum(["ACCOUNT", "CREDIT_CARD"]),
  tagIds: z.array(z.number()).optional(),
  // Campos condicionales según paymentMethod
  accountId: z.number().optional(),
  creditCardId: z.number().optional(),
  installmentsCount: z.number().int().min(1).optional(),
  // Reintegro (solo aplica para CREDIT_CARD)
  reimbursementEnabled: z.boolean().optional(),
  reimbursementAmount: z.number().positive().optional(),
  reimbursementAccountId: z.number().optional(),
  reimbursementAt: z.string().optional(),
  // Gasto compartido (solo aplica para EXPENSE)
  sharedExpenseEnabled: z.boolean().optional(),
  sharedAmount: z.number().positive().optional(),
  sharedReimbursementAccountId: z.number().optional(),
};

export function buildMovementSchema(mode: "create" | "edit" = "create") {
  return z.object(baseShape).superRefine((data, ctx) => {
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
      if (data.reimbursementEnabled) {
        if (!data.reimbursementAmount || data.reimbursementAmount <= 0) {
          ctx.addIssue({
            code: "custom",
            message: "Ingresá el monto del reintegro",
            path: ["reimbursementAmount"],
          });
        }
        if (!data.reimbursementAccountId) {
          ctx.addIssue({
            code: "custom",
            message: "Seleccionar una cuenta de acreditación",
            path: ["reimbursementAccountId"],
          });
        }
      }
    }

    if (data.sharedExpenseEnabled) {
      if (!data.sharedAmount || data.sharedAmount <= 0) {
        ctx.addIssue({
          code: "custom",
          message: "Ingresá el monto compartido",
          path: ["sharedAmount"],
        });
      }
      if (mode === "create" && !data.sharedReimbursementAccountId) {
        ctx.addIssue({
          code: "custom",
          message: "Seleccionar una cuenta",
          path: ["sharedReimbursementAccountId"],
        });
      }
    }
  });
}

export const movementSchema = buildMovementSchema("create");
export type MovementFormValues = z.infer<typeof movementSchema>;
