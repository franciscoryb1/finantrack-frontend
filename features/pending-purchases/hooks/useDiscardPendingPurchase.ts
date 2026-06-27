import { useMutation, useQueryClient } from "@tanstack/react-query";
import { discardPendingPurchase } from "../api/pending-purchases.api";
import { toast } from "sonner";

export function useDiscardPendingPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => discardPendingPurchase(id),
    onSuccess: () => {
      toast.success("Consumo descartado");
      queryClient.invalidateQueries({ queryKey: ["pending-purchases"] });
      queryClient.invalidateQueries({ queryKey: ["pending-purchases-count"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
