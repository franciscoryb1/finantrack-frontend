import { z } from "zod";

export const creditCardSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),

  brand: z.enum(["VISA", "MASTERCARD"]),

  bankAccountId: z.number().min(1),

  limit: z.number().min(1, "Debe ser mayor a 0"),

  cardLast4: z.string().length(4, "Debe tener 4 dígitos"),

  expiryMonth: z.number().min(1).max(12),

  expiryYear: z.number().min(new Date().getFullYear()),

  isActive: z.boolean(),

  backgroundColor: z.string().optional(),
});

export type CreditCardFormValues = z.infer<
  typeof creditCardSchema
>;