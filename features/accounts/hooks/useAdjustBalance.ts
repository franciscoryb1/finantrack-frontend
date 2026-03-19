import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adjustBalance } from "../api/accounts.api";
import { toast } from "sonner";

export function useAdjustBalance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newBalanceCents, note, categoryId }: { id: number; newBalanceCents: number; note?: string; categoryId?: number }) =>
      adjustBalance(id, { newBalanceCents, note, categoryId }),
    onSuccess: () => {
      toast.success("Saldo ajustado correctamente");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Error al ajustar el saldo");
    },
  });
}
