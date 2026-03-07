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

export function payStatement(statementId: number, data: PayStatementInput) {
  return apiFetch<{ id: number; status: string }>(
    `/credit-card-statements/${statementId}/pay`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}
