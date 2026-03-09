import { useQuery } from "@tanstack/react-query";
import { getRecurringExpenseOccurrences } from "../api/recurring-expenses.api";

export function useRecurringExpenseOccurrences(year: number, month: number) {
  return useQuery({
    queryKey: ["recurring-occurrences", year, month],
    queryFn: () => getRecurringExpenseOccurrences(year, month),
    retry: false,
    refetchOnWindowFocus: false,
  });
}
