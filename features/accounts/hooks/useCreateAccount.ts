import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccount, CreateAccountInput } from "../api/accounts.api";
import { toast } from "sonner";

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountInput) => createAccount(data),
    onSuccess: () => {
      toast.success("Cuenta creada");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
