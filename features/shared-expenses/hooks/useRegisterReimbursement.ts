"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  registerMovementReimbursement,
  registerPurchaseReimbursement,
  RegisterReimbursementInput,
} from "../api/shared-expenses.api";

export function useRegisterMovementReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ movementId, input }: { movementId: number; input: RegisterReimbursementInput }) =>
      registerMovementReimbursement(movementId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}

export function useRegisterPurchaseReimbursement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ purchaseId, input }: { purchaseId: number; input: RegisterReimbursementInput }) =>
      registerPurchaseReimbursement(purchaseId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-activity"] });
      queryClient.invalidateQueries({ queryKey: ["movements"] });
    },
  });
}
