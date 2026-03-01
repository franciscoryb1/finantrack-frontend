import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { UpdateCreditCardInput } from "../api/credit-cards.api";
import { toast } from "sonner";

export function useUpdateCreditCard(cardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCreditCardInput) =>
      apiFetch(`/credit-cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Tarjeta actualizada");
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}