import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { UpdateCreditCardInput } from "../api/credit-cards.api";

export function useUpdateCreditCard(cardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCreditCardInput) =>
      apiFetch(`/credit-cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["credit-cards"],
      });
    },
  });
}