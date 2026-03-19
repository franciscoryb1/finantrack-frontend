import { apiFetch } from "@/lib/api";

export type SharedExpenseSummary = {
  sharedAmountCents: number;
  receivedAmountCents: number;
  pendingAmountCents: number;
};

export type RegisterReimbursementInput = {
  accountId: number;
  amountCents: number;
  occurredAt: string;
  description?: string;
};

export type RegisterReimbursementResult = {
  movement: { id: number; amountCents: number; occurredAt: string; description: string | null };
  sharedExpense: SharedExpenseSummary;
};

export function registerMovementReimbursement(
  movementId: number,
  input: RegisterReimbursementInput
): Promise<RegisterReimbursementResult> {
  return apiFetch(`/movements/${movementId}/reimburse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export function registerPurchaseReimbursement(
  purchaseId: number,
  input: RegisterReimbursementInput
): Promise<RegisterReimbursementResult> {
  return apiFetch(`/credit-card-purchases/${purchaseId}/reimburse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
