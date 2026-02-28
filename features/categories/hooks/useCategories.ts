import { useQuery } from "@tanstack/react-query";
import { getCategories, CategoryType } from "../api/categories.api";

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
    select: (data) => (type ? data.filter((c) => c.type === type) : data),
  });
}
