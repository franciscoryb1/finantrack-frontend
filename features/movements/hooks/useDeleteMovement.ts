import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteMovement } from "../api/movements.api";
import { toast } from "sonner";

export function useDeleteMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteMovement(id),
    onSuccess: () => {
      toast.success("Movimiento eliminado");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movements-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
