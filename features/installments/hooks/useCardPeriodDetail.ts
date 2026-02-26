import { useQuery } from "@tanstack/react-query";
import { getCardPeriodDetail } from "../api/getCardPeriodDetail";

export function useCardPeriodDetail(
  cardId: number,
  year?: number,
  month?: number
) {
  return useQuery({
    queryKey: ["card-period", cardId, year, month],
    queryFn: () =>
      getCardPeriodDetail(cardId, year, month),
  });
}