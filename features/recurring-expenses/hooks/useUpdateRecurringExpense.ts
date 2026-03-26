import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateRecurringExpense, UpdateRecurringExpenseInput } from "../api/recurring-expenses.api";

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecurringExpenseInput }) =>
      updateRecurringExpense(id, data),
    onSuccess: () => {
      toast.success("Gasto recurrente actualizado");
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
