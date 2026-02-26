import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type BankAccount = {
  id: number;
  name: string;
};

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () =>
      apiFetch<BankAccount[]>("/accounts?type=BANK"),
  });
}