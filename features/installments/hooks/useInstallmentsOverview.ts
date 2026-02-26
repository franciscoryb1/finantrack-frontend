import { useQuery } from "@tanstack/react-query";
import { getInstallmentsOverview } from "../api/installments.api";

export function useInstallmentsOverview() {
  return useQuery({
    queryKey: ["installments-overview"],
    queryFn: getInstallmentsOverview,
  });
}