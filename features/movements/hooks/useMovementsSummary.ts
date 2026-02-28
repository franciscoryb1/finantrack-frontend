import { useQuery } from "@tanstack/react-query";
import { getMovementsSummary } from "../api/movements.api";

type Params = {
  fromDate?: string;
  toDate?: string;
  accountId?: number;
};

export function useMovementsSummary(params: Params) {
  return useQuery({
    queryKey: ["movements-summary", params],
    queryFn: () => getMovementsSummary(params),
  });
}
