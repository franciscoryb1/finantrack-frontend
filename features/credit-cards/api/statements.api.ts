import { apiFetch } from "@/lib/api";

export function closeStatement(statementId: number) {
  return apiFetch<{ id: number; status: string; totalCents: number }>(
    `/credit-card-statements/${statementId}/close`,
    { method: "POST" }
  );
}

export type PayStatementInput = {
  accountId: number;
  description?: string;
  paidAt?: string;
};

export type StatementExtraInput = {
  description: string;
  amountCents: number;
};

export function addStatementExtra(statementId: number, data: StatementExtraInput) {
  return apiFetch<{ id: number; description: string; amountCents: number }>(
    `/credit-card-statements/${statementId}/extras`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export function removeStatementExtra(statementId: number, extraId: number) {
  return apiFetch<void>(
    `/credit-card-statements/${statementId}/extras/${extraId}`,
    { method: "DELETE" }
  );
}

export function payStatement(statementId: number, data: PayStatementInput) {
  return apiFetch<{ id: number; status: string }>(
    `/credit-card-statements/${statementId}/pay`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}
