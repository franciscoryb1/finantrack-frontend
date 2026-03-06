"use client";

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

  async function handleSubmit(values: AccountFormValues) {
    await mutation.mutateAsync({
      name: values.name,
      type: values.type,
      currentBalanceCents:
        values.currentBalance !== undefined
          ? Math.round(values.currentBalance * 100)
          : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear cuenta</DialogTitle>
        </DialogHeader>
        <AccountForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
