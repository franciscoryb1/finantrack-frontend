import { apiFetch } from "@/lib/api";

export type InstallmentsOverview = {
  totalDebtCents: number;
  totalNextStatementCents: number;
  cards: {
    cardId: number;
    name: string;
    brand: string | null;
    limitCents: number;
    backgroundColor: string | null;

    committedCents: number;
    availableCents: number;

    openStatementAccumulatedCents: number;
    activeInstallmentsCount: number;

    openStatement: null | {
      id: number;
      sequenceNumber: number;
      year: number;
      month: number;
      closingDate: string;
      dueDate: string;
    };
  }[];
};

export function getInstallmentsOverview() {
  return apiFetch<InstallmentsOverview>(
    "/installments/overview",
    {
      method: "GET",
    }
  );
}