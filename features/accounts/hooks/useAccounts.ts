import { useQuery } from "@tanstack/react-query";
import { getAccounts, AccountType } from "../api/accounts.api";

export function useAccounts(type?: AccountType) {
  return useQuery({
    queryKey: ["accounts", type ?? "all"],
    queryFn: () => getAccounts(type),
  });
}
