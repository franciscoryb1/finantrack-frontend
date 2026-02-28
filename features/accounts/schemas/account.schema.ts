import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  type: z.enum(["CASH", "BANK", "WALLET"]),
  currentBalance: z.number().min(0).optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
