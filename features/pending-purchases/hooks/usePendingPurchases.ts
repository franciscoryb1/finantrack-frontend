import { useQuery } from "@tanstack/react-query";
import { getPendingPurchases } from "../api/pending-purchases.api";

export function usePendingPurchases() {
  return useQuery({
    queryKey: ["pending-purchases"],
    queryFn: getPendingPurchases,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
