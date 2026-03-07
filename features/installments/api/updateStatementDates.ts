import { apiFetch } from "@/lib/api";

export function updateStatementDates(
  statementId: number,
  data: { closingDate?: string; dueDate?: string },
) {
  return apiFetch(`/credit-card-statements/${statementId}/dates`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
