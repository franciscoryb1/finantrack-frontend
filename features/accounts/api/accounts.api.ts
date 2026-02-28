import { apiFetch } from "@/lib/api";

export type AccountType = "CASH" | "BANK" | "CREDIT_CARD" | "WALLET";

export type Account = {
  id: number;
  name: string;
  type: AccountType;
  currentBalanceCents: number;
  isActive: boolean;
};

export type CreateAccountInput = {
  name: string;
  type: Exclude<AccountType, "CREDIT_CARD">;
  currentBalanceCents?: number;
};

export function getAccounts(params?: {
  type?: AccountType;
  status?: "active" | "inactive" | "all";
}) {
  const query = new URLSearchParams();
  if (params?.type) query.set("type", params.type);
  if (params?.status) query.set("status", params.status);
  const qs = query.toString();
  return apiFetch<Account[]>(`/accounts${qs ? `?${qs}` : ""}`);
}

export function createAccount(data: CreateAccountInput) {
  return apiFetch<Account>("/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function activateAccount(id: number) {
  return apiFetch<Account>(`/accounts/${id}/activate`, { method: "PATCH" });
}

export function deactivateAccount(id: number) {
  return apiFetch<Account>(`/accounts/${id}/deactivate`, { method: "PATCH" });
}
