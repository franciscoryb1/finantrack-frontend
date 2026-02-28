import { apiFetch } from "@/lib/api";

export type CategoryType = "INCOME" | "EXPENSE";

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  isActive: boolean;
};

export function getCategories() {
  return apiFetch<Category[]>("/categories");
}
