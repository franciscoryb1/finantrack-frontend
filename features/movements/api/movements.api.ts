import { apiFetch } from "@/lib/api";

export type MovementType = "INCOME" | "EXPENSE";

export type Movement = {
  id: number;
  type: MovementType;
  amountCents: number;
  description: string | null;
  occurredAt: string;
  account: { id: number; name: string; type: string };
  category: { id: number; name: string; type: string } | null;
};

export type MovementsResponse = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: Movement[];
};

export type MovementsSummary = {
  totalIncomeCents: number;
  totalExpenseCents: number;
  netBalanceCents: number;
  movementsCount: number;
};

export type ListMovementsParams = {
  fromDate?: string;
  toDate?: string;
  type?: MovementType;
  accountId?: number;
  categoryId?: number;
  page?: number;
  pageSize?: number;
};

export type CreateMovementInput = {
  accountId: number;
  categoryId?: number;
  type: MovementType;
  amountCents: number;
  occurredAt: string;
  description?: string;
};

export function getMovements(params: ListMovementsParams) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.type) query.set("type", params.type);
  if (params.accountId) query.set("accountId", String(params.accountId));
  if (params.categoryId) query.set("categoryId", String(params.categoryId));
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  return apiFetch<MovementsResponse>(`/movements?${query.toString()}`);
}

export function getMovementsSummary(params: Pick<ListMovementsParams, "fromDate" | "toDate" | "accountId">) {
  const query = new URLSearchParams();
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  if (params.accountId) query.set("accountId", String(params.accountId));
  return apiFetch<MovementsSummary>(`/movements/summary?${query.toString()}`);
}

export function createMovement(data: CreateMovementInput) {
  return apiFetch<Movement>("/movements", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateMovementInput = Partial<CreateMovementInput>;

export function updateMovement(id: number, data: UpdateMovementInput) {
  return apiFetch<Movement>(`/movements/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteMovement(id: number) {
  return apiFetch<void>(`/movements/${id}`, { method: "DELETE" });
}
