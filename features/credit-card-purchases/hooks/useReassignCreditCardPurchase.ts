import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reassignCreditCardPurchase, ReassignCardInput } from "../api/credit-card-purchases.api";
import { toast } from "sonner";

export function useReassignCreditCardPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ReassignCardInput }) =>
      reassignCreditCardPurchase(id, data),
    onSuccess: () => {
      toast.success("Tarjeta actualizada");
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["installments-overview"] });
      queryClient.invalidateQueries({ queryKey: ["card-period"] });
      queryClient.invalidateQueries({ queryKey: ["card-periods"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
