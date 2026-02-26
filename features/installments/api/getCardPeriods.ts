import { apiFetch } from "@/lib/api";

export type CardPeriodItem = {
  year: number;
  month: number;
  status: string;
};

export function getCardPeriods(cardId: number) {
  return apiFetch<CardPeriodItem[]>(
    `/installments/card/${cardId}/periods`
  );
}