import { apiFetch } from "@/lib/api";

export type DashboardActivityItem = {
  kind: "MOVEMENT" | "CREDIT_CARD_INSTALLMENT";
  id: number;
  description: string | null;
  occurredAt: string;          // Para movimientos: fecha real. Para cuotas: fecha del resumen.
  purchaseDate: string | null; // Solo para cuotas: fecha original de la compra.
  registeredAt: string;        // Fecha de registro del movimiento o compra en el sistema.
  amountCents: number;
  type: "INCOME" | "EXPENSE" | "STATEMENT_PAYMENT" | "TRANSFER_OUT" | "TRANSFER_IN" | "BALANCE_ADJUSTMENT";
  isRecurring: boolean;
  tags: { id: number; name: string; color: string | null }[];
  category: { id: number; name: string; color: string | null; parent: { id: number; name: string; color: string | null } | null } | null;
  account: { id: number; name: string; type: string } | null;
  creditCard: { id: number; name: string; brand: string | null; cardLast4: string } | null;
  installmentInfo: { installmentNumber: number; installmentsCount: number; purchaseId: number; reimbursementAmountCents: number | null; reimbursementAccountId: number | null; reimbursementAt: string | null } | null;
  transferData: {
    id: number;
    fromAccountId: number;
    toAccountId: number;
    amountCents: number;
    description: string | null;
    transferredAt: string;
    fromAccount: { id: number; name: string };
    toAccount: { id: number; name: string };
  } | null;
  sharedExpense: {
    sharedAmountCents: number;
    receivedAmountCents: number;
    pendingAmountCents: number;
  } | null;
  incomeSource: "PURCHASE_REIMBURSEMENT" | "SHARED_REIMBURSEMENT" | null;
  balanceAdjustmentIncreased: boolean | null;
};

export type DashboardActivityResponse = {
  items: DashboardActivityItem[];
};

export function getDashboardActivity(year: number, month: number) {
  return apiFetch<DashboardActivityResponse>(
    `/dashboard/activity?year=${year}&month=${month}`
  );
}
