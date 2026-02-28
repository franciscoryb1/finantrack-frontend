import { useQuery } from "@tanstack/react-query";
import { getAccounts, AccountType } from "../api/accounts.api";

export function useAccounts(params?: {
  type?: AccountType;
  status?: "active" | "inactive" | "all";
}) {
  return useQuery({
    queryKey: ["accounts", params?.type ?? "all", params?.status ?? "all"],
    queryFn: () => getAccounts(params),
  });
}
