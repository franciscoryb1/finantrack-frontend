import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createMovement, CreateMovementInput } from "../api/movements.api";

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMovementInput) => createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movements"] });
      queryClient.invalidateQueries({ queryKey: ["movements-summary"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
    },
  });
}
