import { apiFetch } from "@/lib/api";

export type CardPeriodItem = {
  id: number;
  year: number;
  month: number;
  status: string;
  periodStartDate: string;
  closingDate: string;
  dueDate: string;
};

export function getCardPeriods(cardId: number) {
  return apiFetch<CardPeriodItem[]>(
    `/installments/card/${cardId}/periods`
  );
}