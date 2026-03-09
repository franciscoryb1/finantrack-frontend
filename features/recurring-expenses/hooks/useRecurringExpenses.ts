import { useQuery } from "@tanstack/react-query";
import { getRecurringExpenses } from "../api/recurring-expenses.api";

export function useRecurringExpenses() {
  return useQuery({
    queryKey: ["recurring-expenses"],
    queryFn: getRecurringExpenses,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
