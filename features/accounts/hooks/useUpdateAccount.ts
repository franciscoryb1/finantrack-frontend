import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateAccount } from "../api/accounts.api";
import { toast } from "sonner";

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      updateAccount(id, name),
    onSuccess: () => {
      toast.success("Cuenta actualizada");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
