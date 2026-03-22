import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteRecurringExpense } from "../api/recurring-expenses.api";

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteRecurringExpense(id),
    onSuccess: () => {
      toast.success("Gasto recurrente eliminado");
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
