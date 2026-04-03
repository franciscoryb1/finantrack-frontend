import { apiFetch } from "@/lib/api";

export type CreateCreditCardPurchaseInput = {
  creditCardId: number;
  categoryId?: number;
  totalAmountCents: number;
  installmentsCount: number;
  occurredAt: string;
  description?: string;
  reimbursementAmountCents?: number;
  reimbursementAccountId?: number;
  reimbursementAt?: string;
  sharedAmountCents?: number;
  tagIds?: number[];
};

export function createCreditCardPurchase(data: CreateCreditCardPurchaseInput) {
  return apiFetch<{ id: number }>("/credit-card-purchases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type ImportLegacyPurchaseInput = {
  creditCardId: number;
  categoryId?: number;
  totalAmountCents: number;
  installmentsCount: number;
  paidInstallmentsCount: number;
  occurredAt: string;
  description?: string;
  firstStatementYear: number;
  firstStatementMonth: number;
};

export type UpdateCreditCardPurchaseInput = {
  totalAmountCents?: number;
  installmentsCount?: number;
  categoryId?: number | null;
  description?: string | null;
  reimbursementAmountCents?: number | null;
  reimbursementAccountId?: number | null;
  reimbursementAt?: string | null;
  sharedAmountCents?: number | null;
  tagIds?: number[];
};

export function deleteCreditCardPurchase(id: number) {
  return apiFetch<void>(`/credit-card-purchases/${id}`, { method: "DELETE" });
}

export function updateCreditCardPurchase(id: number, data: UpdateCreditCardPurchaseInput) {
  return apiFetch<{ id: number }>(`/credit-card-purchases/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export type ReassignCardInput = {
  creditCardId: number;
  occurredAt?: string;
};

export type CreateCreditCardCreditInput = {
  creditCardId: number;
  amountCents: number;
  occurredAt: string;
  description?: string;
  categoryId?: number;
};

export function createCreditCardCredit(data: CreateCreditCardCreditInput) {
  return apiFetch<{ id: number }>("/credit-card-purchases/credit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function importLegacyPurchase(data: ImportLegacyPurchaseInput) {
  return apiFetch<{ id: number }>("/credit-card-purchases/legacy-import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function reassignCreditCardPurchase(id: number, data: ReassignCardInput) {
  return apiFetch<{ id: number }>(`/credit-card-purchases/${id}/reassign-card`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export type CreditCardPurchaseByDate = {
  id: number;
  description: string | null;
  occurredAt: string;
  totalAmountCents: number;
  installmentsCount: number;
  isCredit: boolean;
  category: {
    id: number;
    name: string;
    color: string | null;
    parent: { id: number; name: string; color: string | null } | null;
  } | null;
  creditCard: { id: number; name: string; cardLast4: string; brand: string | null } | null;
};

export function getCreditCardPurchasesByDate(fromDate: string, toDate: string) {
  return apiFetch<CreditCardPurchaseByDate[]>(
    `/credit-card-purchases?fromDate=${fromDate}&toDate=${toDate}`
  );
}
