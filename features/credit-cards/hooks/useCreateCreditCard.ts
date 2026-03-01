import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createCreditCard,
  CreateCreditCardInput,
} from "../api/credit-cards.api";
import { toast } from "sonner";

export function useCreateCreditCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCreditCardInput) => createCreditCard(data),
    onSuccess: () => {
      toast.success("Tarjeta creada");
      queryClient.invalidateQueries({ queryKey: ["credit-cards"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}