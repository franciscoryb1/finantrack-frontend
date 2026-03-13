import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payRecurringExpense, PayRecurringExpenseInput } from "../api/recurring-expenses.api";

export function usePayRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: PayRecurringExpenseInput }) =>
      payRecurringExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-occurrences"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movements-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
