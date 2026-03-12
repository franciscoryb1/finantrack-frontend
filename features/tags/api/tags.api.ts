import { apiFetch } from "@/lib/api";

export type Tag = {
  id: number;
  name: string;
  color: string | null;
};

export function getTags() {
  return apiFetch<Tag[]>("/tags");
}

export function createTag(data: { name: string; color?: string }) {
  return apiFetch<Tag>("/tags", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function deleteTag(id: number) {
  return apiFetch<void>(`/tags/${id}`, { method: "DELETE" });
}
