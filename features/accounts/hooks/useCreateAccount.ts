import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAccount, CreateAccountInput } from "../api/accounts.api";

export function useCreateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAccountInput) => createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
