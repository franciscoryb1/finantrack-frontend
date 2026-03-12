import { apiFetch } from "@/lib/api";

export type CreateTransferInput = {
  fromAccountId: number;
  toAccountId: number;
  amountCents: number;
  description?: string;
  transferredAt?: string;
};

export type UpdateTransferInput = {
  amountCents?: number;
  transferredAt?: string;
  description?: string;
  tagIds?: number[];
};

export type AccountTransfer = {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  amountCents: number;
  description: string | null;
  transferredAt: string;
  fromAccount: { id: number; name: string };
  toAccount: { id: number; name: string };
};

export function createTransfer(data: CreateTransferInput) {
  return apiFetch<AccountTransfer>("/account-transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTransfer(id: number, data: UpdateTransferInput) {
  return apiFetch<AccountTransfer>(`/account-transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
