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

export function importLegacyPurchase(data: ImportLegacyPurchaseInput) {
  return apiFetch<{ id: number }>("/credit-card-purchases/legacy-import", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
