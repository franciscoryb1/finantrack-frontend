import { apiFetch } from "@/lib/api";

export type CreateCreditCardPurchaseInput = {
  creditCardId: number;
  categoryId?: number;
  totalAmountCents: number;
  installmentsCount: number;
  occurredAt: string;
  description?: string;
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
  categoryId?: number | null;
  description?: string | null;
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
