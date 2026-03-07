import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateStatementDates } from "../api/updateStatementDates";
import { toast } from "sonner";

export function useUpdateStatementDates(cardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      statementId,
      closingDate,
      dueDate,
    }: {
      statementId: number;
      closingDate?: string;
      dueDate?: string;
    }) => updateStatementDates(statementId, { closingDate, dueDate }),
    onSuccess: () => {
      toast.success("Fechas actualizadas");
      queryClient.invalidateQueries({ queryKey: ["card-period", cardId] });
      queryClient.invalidateQueries({ queryKey: ["card-periods", cardId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
