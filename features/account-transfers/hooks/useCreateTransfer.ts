import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTransfer, CreateTransferInput } from "../api/account-transfers.api";
import { toast } from "sonner";

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransferInput) => createTransfer(data),
    onSuccess: () => {
      toast.success("Transferencia realizada");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
