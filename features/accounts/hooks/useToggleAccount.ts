import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateAccount, deactivateAccount } from "../api/accounts.api";
import { toast } from "sonner";

export function useToggleAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
      activate ? activateAccount(id) : deactivateAccount(id),
    onSuccess: (_data, variables) => {
      toast.success(variables.activate ? "Cuenta activada" : "Cuenta desactivada");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
