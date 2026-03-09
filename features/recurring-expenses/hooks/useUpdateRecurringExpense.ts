import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateRecurringExpense, UpdateRecurringExpenseInput } from "../api/recurring-expenses.api";

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecurringExpenseInput }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
  });
}
