import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateMovement, UpdateMovementInput } from "../api/movements.api";
import { toast } from "sonner";

export function useUpdateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMovementInput }) =>
      updateMovement(id, data),
    onSuccess: () => {
      toast.success("Movimiento actualizado");
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movements-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
