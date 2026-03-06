import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCategory, UpdateCategoryInput } from "../api/categories.api";
import { toast } from "sonner";

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryInput }) =>
      updateCategory(id, data),
    onSuccess: () => {
      toast.success("Categoría actualizada");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
