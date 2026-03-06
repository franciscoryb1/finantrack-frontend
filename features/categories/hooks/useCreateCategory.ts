import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCategory, CreateCategoryInput } from "../api/categories.api";
import { toast } from "sonner";

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory(data),
    onSuccess: () => {
      toast.success("Categoría creada");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
