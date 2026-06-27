import { apiFetch } from "@/lib/api";

export type ParserConfidence = "HIGH" | "MEDIUM" | "LOW";

export type PendingPurchase = {
  id: number;
  description: string | null;
  occurredAt: string;
  totalAmountCents: number;
  installmentsCount: number;
  parserConfidence: ParserConfidence | null;
  status: "PENDING_REVIEW" | "CONFIRMED" | "DISCARDED";
  source: "MANUAL" | "EMAIL";
  rawEmailData: { bank?: string; [key: string]: unknown } | null;
  creditCard: {
    id: number;
    name: string;
    cardLast4: string;
    brand: string | null;
  } | null;
  category: {
    id: number;
    name: string;
    color: string | null;
    parent: { id: number; name: string; color: string | null } | null;
  } | null;
};

export type ConfirmPendingInput = {
  creditCardId?: number;
  categoryId?: number;
  totalAmountCents?: number;
  installmentsCount?: number;
  occurredAt?: string;
  description?: string;
};

export function getPendingPurchases() {
  return apiFetch<PendingPurchase[]>("/credit-card-purchases/pending");
}

export function getPendingPurchasesCount() {
  return apiFetch<{ count: number }>("/credit-card-purchases/pending-count");
}

export function confirmPendingPurchase(id: number, data: ConfirmPendingInput) {
  return apiFetch<{ id: number }>(`/credit-card-purchases/${id}/confirm`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function discardPendingPurchase(id: number) {
  return apiFetch<{ id: number }>(`/credit-card-purchases/${id}/discard`, {
    method: "PATCH",
  });
}
