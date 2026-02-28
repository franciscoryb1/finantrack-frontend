import { apiFetch } from "@/lib/api";

export type CardPeriodDetail = {
  card: {
    id: number;
    name: string;
    limitCents: number;
    backgroundColor: string;
  };
  period: {
    id: number;
    year: number;
    month: number;
    totalCents: number;
    closingDate: string;
    dueDate: string;
    status: string;
  };
  purchases: {
    purchaseId: number;
    description: string | null;
    occurredAt: string;
    totalAmountCents: number;
    installmentsCount: number;
    installmentsPaid: number;
    installmentsRemaining: number;
    installmentForThisPeriod: {
      installmentNumber: number;
      amountCents: number;
      status: string;
    };
  }[];
};

export function getCardPeriodDetail(
  cardId: number,
  year?: number,
  month?: number
) {
  const query =
    year && month ? `?year=${year}&month=${month}` : "";

  return apiFetch<CardPeriodDetail>(
    `/installments/card/${cardId}/period${query}`
  );
}