import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteCreditCardPurchase } from "../api/credit-card-purchases.api";
import { toast } from "sonner";

export function useDeleteCreditCardPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteCreditCardPurchase(id),
    onSuccess: () => {
      toast.success("Compra eliminada");
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["installments-overview"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
