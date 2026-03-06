import { useMutation, useQueryClient } from "@tanstack/react-query";
import { activateCategory, deactivateCategory } from "../api/categories.api";
import { toast } from "sonner";

export function useToggleCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, activate }: { id: number; activate: boolean }) =>
      activate ? activateCategory(id) : deactivateCategory(id),
    onSuccess: (_, { activate }) => {
      toast.success(activate ? "Categoría activada" : "Categoría desactivada");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
