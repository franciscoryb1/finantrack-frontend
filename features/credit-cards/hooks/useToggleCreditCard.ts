import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { toast } from "sonner";

export function useToggleCreditCard(cardId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (isActive: boolean) =>
      apiFetch(`/credit-cards/${cardId}/${isActive ? "deactivate" : "activate"}`, {
        method: "PATCH",
      }),
    onSuccess: (_data, isActive) => {
      toast.success(isActive ? "Tarjeta desactivada" : "Tarjeta activada");
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
      queryClient.invalidateQueries({ queryKey: ["credit-card-summary", cardId] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}