import { apiFetch } from "@/lib/api";

export type CardPeriodItem = {
  year: number;
  month: number;
  status: string;
  periodStartDate: string;
  closingDate: string;
};

export function getCardPeriods(cardId: number) {
  return apiFetch<CardPeriodItem[]>(
    `/installments/card/${cardId}/periods`
  );
}