import { useQuery } from "@tanstack/react-query";
import { getMovements, ListMovementsParams } from "../api/movements.api";

export function useMovements(params: ListMovementsParams) {
  return useQuery({
    queryKey: ["movements", params],
    queryFn: () => getMovements(params),
  });
}
