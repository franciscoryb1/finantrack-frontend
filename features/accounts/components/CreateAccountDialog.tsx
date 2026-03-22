"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AccountForm } from "./AccountForm";
import { useCreateAccount } from "../hooks/useCreateAccount";
import { AccountFormValues } from "../schemas/account.schema";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateAccountDialog({ open, onOpenChange }: Props) {
  const mutation = useCreateAccount();
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(values: AccountFormValues) {
    setServerError(null);
    try {
      await mutation.mutateAsync({
        name: values.name,
        type: values.type,
        currentBalanceCents:
          values.currentBalance !== undefined
            ? Math.round(values.currentBalance * 100)
            : undefined,
      });
      onOpenChange(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setServerError(null); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear cuenta</DialogTitle>
        </DialogHeader>
        {serverError && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            {serverError}
          </p>
        )}
        <AccountForm onSubmit={handleSubmit} isPending={mutation.isPending} />
      </DialogContent>
    </Dialog>
  );
}
