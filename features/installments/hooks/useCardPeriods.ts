import { useQuery } from "@tanstack/react-query";
import { getCardPeriods } from "../api/getCardPeriods";

export function useCardPeriods(cardId: number) {
  return useQuery({
    queryKey: ["card-periods", cardId],
    queryFn: () => getCardPeriods(cardId),
  });
}