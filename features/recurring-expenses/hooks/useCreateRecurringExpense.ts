import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRecurringExpense, CreateRecurringExpenseInput } from "../api/recurring-expenses.api";

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecurringExpenseInput) => createRecurringExpense(data),
    onSuccess: () => {
      toast.success("Gasto recurrente creado");
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
