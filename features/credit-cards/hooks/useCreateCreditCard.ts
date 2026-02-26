import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCreditCard,
  CreateCreditCardInput,
} from "../api/credit-cards.api";

export function useCreateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditCardInput) =>
      createCreditCard(data),

    onSuccess: () => {
      // Invalida lista de tarjetas
      queryClient.invalidateQueries({
        queryKey: ["credit-cards"],
      });
    },
  });
}