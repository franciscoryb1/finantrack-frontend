import { useQuery } from "@tanstack/react-query";
import { getDashboardActivity } from "../api/dashboard.api";

export function useDashboardActivity(year: number, month: number) {
  return useQuery({
    queryKey: ["dashboard-activity", year, month],
    queryFn: () => getDashboardActivity(year, month),
  });
}
