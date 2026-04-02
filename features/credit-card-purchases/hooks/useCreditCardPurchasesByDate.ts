import { useQuery } from "@tanstack/react-query";
import { getCreditCardPurchasesByDate } from "../api/credit-card-purchases.api";

export function useCreditCardPurchasesByDate(fromDate: string, toDate: string) {
  return useQuery({
    queryKey: ["credit-card-purchases-by-date", fromDate, toDate],
    queryFn: () => getCreditCardPurchasesByDate(fromDate, toDate),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
