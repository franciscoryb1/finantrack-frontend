import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addStatementExtra, removeStatementExtra, StatementExtraInput } from "../api/statements.api";
import { toast } from "sonner";

export function useAddStatementExtra(cardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ statementId, data }: { statementId: number; data: StatementExtraInput }) =>
      addStatementExtra(statementId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-period", cardId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveStatementExtra(cardId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ statementId, extraId }: { statementId: number; extraId: number }) =>
      removeStatementExtra(statementId, extraId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["card-period", cardId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
