import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  confirmPendingPurchase,
  ConfirmPendingInput,
} from "../api/pending-purchases.api";
import { toast } from "sonner";

export function useConfirmPendingPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ConfirmPendingInput }) =>
      confirmPendingPurchase(id, data),
    onSuccess: () => {
      toast.success("Consumo confirmado");
      queryClient.invalidateQueries({ queryKey: ["pending-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["pending-purchases-count"] });
      queryClient.invalidateQueries({ queryKey: ["credit-card-purchases-by-date"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["installments-overview"] });
      queryClient.invalidateQueries({ queryKey: ["card-period"] });
      queryClient.invalidateQueries({ queryKey: ["card-periods"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
