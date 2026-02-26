import { useQuery } from "@tanstack/react-query";
import { getCreditCardSummary } from "../api/credit-cards.api";

export function useCreditCardSummary(cardId: number) {
  return useQuery({
    queryKey: ["credit-card-summary", cardId],
    queryFn: () => getCreditCardSummary(cardId),
    enabled: !!cardId,
  });
}   