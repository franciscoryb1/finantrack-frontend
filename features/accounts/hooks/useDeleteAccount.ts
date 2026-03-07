import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAccount } from "../api/accounts.api";
import { toast } from "sonner";

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteAccount(id),
    onSuccess: () => {
      toast.success("Cuenta eliminada");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
