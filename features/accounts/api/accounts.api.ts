import { apiFetch } from "@/lib/api";

export type AccountType = "CASH" | "BANK" | "CREDIT_CARD" | "WALLET";

export type Account = {
  id: number;
  name: string;
  type: AccountType;
};

export function getAccounts(type?: AccountType) {
  const params = type ? `?type=${type}` : "";
  return apiFetch<Account[]>(`/accounts${params}`);
}
