import { useQuery } from "@tanstack/react-query";
import { getPendingPurchasesCount } from "../api/pending-purchases.api";

export function usePendingPurchasesCount() {
  return useQuery({
    queryKey: ["pending-purchases-count"],
    queryFn: getPendingPurchasesCount,
    retry: false,
    refetchOnWindowFocus: true,
    select: (data) => data.count,
  });
}
