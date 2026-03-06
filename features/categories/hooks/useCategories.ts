import { useQuery } from "@tanstack/react-query";
import { getCategories, CategoryType } from "../api/categories.api";

export function useCategories(type?: CategoryType, includeInactive = false) {
  return useQuery({
    queryKey: ["categories", includeInactive],
    queryFn: () => getCategories(includeInactive),
    select: (data) => (type ? data.filter((c) => c.type === type) : data),
  });
}
