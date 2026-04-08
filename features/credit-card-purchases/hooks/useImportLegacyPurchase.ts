import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importLegacyPurchase, ImportLegacyPurchaseInput } from "../api/credit-card-purchases.api";
import { toast } from "sonner";

export function useImportLegacyPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ImportLegacyPurchaseInput) => importLegacyPurchase(data),
    onSuccess: () => {
      toast.success("Compra importada correctamente");
      queryClient.invalidateQueries({ queryKey: ["installments-overview"] });
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
