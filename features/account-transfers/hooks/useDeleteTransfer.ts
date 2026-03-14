import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTransfer } from "../api/account-transfers.api";
import { toast } from "sonner";

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteTransfer(id),
    onSuccess: () => {
      toast.success("Transferencia eliminada");
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
