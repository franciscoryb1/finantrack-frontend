import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMovement, CreateMovementInput } from "../api/movements.api";
import { toast } from "sonner";

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMovementInput) => createMovement(data),
    onSuccess: () => {
      toast.success("Movimiento guardado");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movements-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
