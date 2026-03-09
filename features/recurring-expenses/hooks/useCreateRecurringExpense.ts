import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRecurringExpense, CreateRecurringExpenseInput } from "../api/recurring-expenses.api";

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecurringExpenseInput) => createRecurringExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
  });
}
