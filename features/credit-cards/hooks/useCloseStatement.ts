import { useMutation, useQueryClient } from "@tanstack/react-query";
import { closeStatement } from "../api/statements.api";
import { toast } from "sonner";

export function useCloseStatement(cardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (statementId: number) => closeStatement(statementId),
    onSuccess: () => {
      toast.success("Resumen cerrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["card-period", cardId] });
      queryClient.invalidateQueries({ queryKey: ["card-periods", cardId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
