import { apiFetch } from "@/lib/api";

/* ===============================
   TYPES
================================= */

export type CreditCard = {
  id: number;
  name: string;
  brand?: string | null;
  limitCents: number;
  closingDay: number;
  dueDay: number;
  cardLast4: string;
  cardExpiresAt: string;
  isActive: boolean;
  backgroundColor?: string | null;
  bankAccount: {
    id: number;
    name: string;
  };
};

export type CreditCardSummary = {
  limitCents: number;
  committedCents: number;
  availableCents: number;
  openStatement?: {
    id: number;
    year: number;
    month: number;
    closingDate: string;
    dueDate: string;
    totalCents: number;
    status: string;
  } | null;
};

export type CreateCreditCardInput = {
  name: string;
  brand?: "VISA" | "MASTERCARD";
  limitCents: number;
  cardLast4: string;
  cardExpiresAt: string;
  bankAccountId: number;
  isActive: boolean;
  backgroundColor?: string;
};

export type UpdateCreditCardInput = {
  name: string;
  brand: "VISA" | "MASTERCARD";
  bankAccountId: number;
  limitCents: number;
  cardLast4: string;
  cardExpiresAt: string;
  isActive: boolean;
  backgroundColor?: string;
};

/* ===============================
   API CALLS
================================= */

export async function getCreditCards() {
  return apiFetch<CreditCard[]>("/credit-cards", {
    method: "GET",
  });
}

export async function getCreditCardSummary(cardId: number) {
  return apiFetch<CreditCardSummary>(
    `/credit-cards/${cardId}/summary`,
    {
      method: "GET",
    }
  );
}

export type CreditCardDeletePreview = {
  purchasesCount: number;
  installmentsCount: number;
  statementsCount: number;
  paymentsCount: number;
};

export async function createCreditCard(data: CreateCreditCardInput) {
  return apiFetch<CreditCard>("/credit-cards", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getCreditCardDeletePreview(cardId: number) {
  return apiFetch<CreditCardDeletePreview>(`/credit-cards/${cardId}/delete-preview`);
}

export async function deleteCreditCard(cardId: number) {
  return apiFetch<void>(`/credit-cards/${cardId}`, { method: "DELETE" });
}