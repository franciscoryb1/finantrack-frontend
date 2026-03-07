import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payStatement, PayStatementInput } from "../api/statements.api";
import { toast } from "sonner";

export function usePayStatement(cardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      statementId,
      ...data
    }: { statementId: number } & PayStatementInput) =>
      payStatement(statementId, data),
    onSuccess: () => {
      toast.success("Resumen pagado correctamente");
      queryClient.invalidateQueries({ queryKey: ["card-period", cardId] });
      queryClient.invalidateQueries({ queryKey: ["card-periods", cardId] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
