import { apiFetch } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

export type RecurringFrequency = "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export type RecurringExpense = {
  id: number;
  name: string;
  description?: string | null;
  amountCents: number;
  frequency: RecurringFrequency;
  dueDay?: number | null;
  dueDayOfWeek?: number | null;
  startDate: string;
  endDate?: string | null;
  categoryId?: number | null;
  isActive: boolean;
  createdAt: string;
  category?: { id: number; name: string; color?: string | null; parent?: { id: number; name: string } | null } | null;
  payments?: { dueDate: string; amountCents: number }[];
};

export type RecurringOccurrence = {
  recurringExpense: {
    id: number;
    name: string;
    description?: string | null;
    amountCents: number;
    frequency: RecurringFrequency;
    dueDay?: number | null;
    dueDayOfWeek?: number | null;
    category?: { id: number; name: string; color?: string | null } | null;
  };
  dueDate: string;
  status: "PAID" | "PENDING" | "OVERDUE";
  payment?: {
    id: number;
    amountCents: number;
    movementId?: number | null;
    creditCardPurchaseId?: number | null;
    createdAt: string;
    accountName?: string;
    creditCardName?: string;
  };
};

export type CreateRecurringExpenseInput = {
  name: string;
  description?: string;
  amountCents: number;
  frequency: RecurringFrequency;
  dueDay?: number;
  dueDayOfWeek?: number;
  startDate: string;
  endDate?: string;
  categoryId?: number;
};

export type UpdateRecurringExpenseInput = {
  name?: string;
  description?: string;
  amountCents?: number;
  frequency?: RecurringFrequency;
  dueDay?: number;
  dueDayOfWeek?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string | null;
};

export type PayRecurringExpenseInput = {
  dueDate: string;
  amountCents: number;
  occurredAt: string;
  accountId?: number;
  creditCardId?: number;
  installmentsCount?: number;
};

// ── API functions ─────────────────────────────────────────────────────────────

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  return apiFetch<RecurringExpense[]>("/recurring-expenses");
}

export async function createRecurringExpense(data: CreateRecurringExpenseInput): Promise<RecurringExpense> {
  return apiFetch<RecurringExpense>("/recurring-expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function updateRecurringExpense(id: number, data: UpdateRecurringExpenseInput): Promise<RecurringExpense> {
  return apiFetch<RecurringExpense>(`/recurring-expenses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function deleteRecurringExpense(id: number): Promise<void> {
  await apiFetch<void>(`/recurring-expenses/${id}`, { method: "DELETE" });
}

export async function getRecurringExpenseOccurrences(year: number, month: number): Promise<RecurringOccurrence[]> {
  return apiFetch<RecurringOccurrence[]>(`/recurring-expenses/upcoming?year=${year}&month=${month}`);
}

export async function payRecurringExpense(id: number, data: PayRecurringExpenseInput): Promise<unknown> {
  return apiFetch<unknown>(`/recurring-expenses/${id}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
