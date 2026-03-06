import { apiFetch } from "@/lib/api";

export type CategoryType = "INCOME" | "EXPENSE";

export type CategoryChild = {
  id: number;
  name: string;
  type: CategoryType;
  parentId: number;
  isActive: boolean;
  userId: number | null;
};

export type Category = {
  id: number;
  name: string;
  type: CategoryType;
  parentId: null;
  isActive: boolean;
  userId: number | null;
  children: CategoryChild[];
};

export type CreateCategoryInput = {
  name: string;
  type?: CategoryType;
  parentId?: number;
};

export function getCategories(includeInactive = false) {
  const qs = includeInactive ? "?includeInactive=true" : "";
  return apiFetch<Category[]>(`/categories${qs}`);
}

export function createCategory(data: CreateCategoryInput) {
  return apiFetch<Category>("/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateCategory(id: number, name: string) {
  return apiFetch<Category>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export function activateCategory(id: number) {
  return apiFetch<Category>(`/categories/${id}/activate`, { method: "PATCH" });
}

export function deactivateCategory(id: number) {
  return apiFetch<Category>(`/categories/${id}/deactivate`, { method: "PATCH" });
}
