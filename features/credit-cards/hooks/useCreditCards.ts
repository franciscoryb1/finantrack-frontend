import { useQuery } from "@tanstack/react-query";
import { getCreditCards } from "../api/credit-cards.api";

export function useCreditCards() {
  return useQuery({
    queryKey: ["credit-cards"],
    queryFn: getCreditCards,
  });
}