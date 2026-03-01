import { apiFetch } from "@/lib/api";

export type DashboardActivityItem = {
  kind: "MOVEMENT" | "CREDIT_CARD_INSTALLMENT";
  id: number;
  description: string | null;
  occurredAt: string;        // Para movimientos: fecha real. Para cuotas: fecha del resumen.
  purchaseDate: string | null; // Solo para cuotas: fecha original de la compra.
  amountCents: number;
  type: "INCOME" | "EXPENSE";
  category: { id: number; name: string } | null;
  account: { id: number; name: string; type: string } | null;
  creditCard: { id: number; name: string; brand: string | null; cardLast4: string } | null;
  installmentInfo: { installmentNumber: number; installmentsCount: number } | null;
};

export type DashboardActivityResponse = {
  items: DashboardActivityItem[];
};

export function getDashboardActivity(year: number, month: number) {
  return apiFetch<DashboardActivityResponse>(
    `/dashboard/activity?year=${year}&month=${month}`
  );
}
