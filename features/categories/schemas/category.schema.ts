import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  color: z.string().nullable().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
