import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCreditCardPurchase,
  CreateCreditCardPurchaseInput,
} from "../api/credit-card-purchases.api";

export function useCreateCreditCardPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditCardPurchaseInput) =>
      createCreditCardPurchase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["installments-overview"] });
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
  });
}
