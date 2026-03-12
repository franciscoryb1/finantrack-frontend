import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateTransfer, UpdateTransferInput } from "../api/account-transfers.api";
import { toast } from "sonner";

export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransferInput }) =>
      updateTransfer(id, data),
    onSuccess: () => {
      toast.success("Transferencia actualizada");
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
