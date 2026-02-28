import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateAccount, deactivateAccount } from "../api/accounts.api";

export function useToggleAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
      activate ? activateAccount(id) : deactivateAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}
