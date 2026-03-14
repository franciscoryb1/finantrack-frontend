import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCreditCard } from "../api/credit-cards.api";
import { toast } from "sonner";

export function useDeleteCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: number) => deleteCreditCard(cardId),
    onSuccess: () => {
      toast.success("Tarjeta eliminada");
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["installments-overview"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
