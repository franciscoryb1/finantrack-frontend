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
