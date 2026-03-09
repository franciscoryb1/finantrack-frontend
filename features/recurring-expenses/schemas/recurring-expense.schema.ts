import { z } from "zod";

export const recurringExpenseSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  description: z.string().optional(),
  amount: z.number().positive("Debe ser mayor a 0"),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
  dueDay: z.number().int().min(1).max(31).optional(),
  dueDayOfWeek: z.number().int().min(0).max(6).optional(),
  startDate: z.string().min(1, "Seleccionar fecha de inicio"),
  endDate: z.string().optional(),
  categoryId: z.number().optional(),
});

export type RecurringExpenseFormValues = z.infer<typeof recurringExpenseSchema>;

export const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quincenal",
  MONTHLY: "Mensual",
};

// 0=Domingo, 1=Lunes, ..., 6=Sábado (igual que Date.getDay())
export const DAY_OF_WEEK_OPTIONS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

export const DAY_OF_WEEK_LABEL: Record<number, string> = Object.fromEntries(
  DAY_OF_WEEK_OPTIONS.map((d) => [d.value, d.label])
);
