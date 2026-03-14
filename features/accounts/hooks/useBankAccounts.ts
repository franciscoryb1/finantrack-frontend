import { useQuery } from "@tanstack/react-query";
import { getAccounts } from "../api/accounts.api";

export type BankAccount = {
  id: number;
  name: string;
  type: "BANK" | "WALLET";
  currentBalanceCents: number;
};

export function useBankAccounts() {
  return useQuery({
    queryKey: ["bank-accounts"],
    queryFn: async () => {
      const accounts = await getAccounts({ status: "active" });
      return accounts
        .filter((a) => a.type === "BANK" || a.type === "WALLET")
        .map((a) => ({ id: a.id, name: a.name, type: a.type as "BANK" | "WALLET", currentBalanceCents: a.currentBalanceCents }));
    },
  });
}
