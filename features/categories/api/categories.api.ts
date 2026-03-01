import { apiFetch } from "@/lib/api";

export type CategoryType = "INCOME" | "EXPENSE";

export type CategoryChild = {
  id: number;
  name: string;
  type: CategoryType;
  parentId: number;
  isActive: boolean;
};

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  parentId: null;
  isActive: boolean;
  children: CategoryChild[];
};

export function getCategories() {
  return apiFetch<Category[]>("/categories");
}
