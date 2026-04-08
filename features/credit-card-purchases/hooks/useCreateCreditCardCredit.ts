import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCreditCardCredit, CreateCreditCardCreditInput } from "../api/credit-card-purchases.api";
import { toast } from "sonner";

export function useCreateCreditCardCredit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditCardCreditInput) => createCreditCardCredit(data),
    onSuccess: () => {
      toast.success("Devolución registrada");
      queryClient.invalidateQueries({ queryKey: ["installments-overview"] });
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["card-period"] });
      queryClient.invalidateQueries({ queryKey: ["card-periods"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
