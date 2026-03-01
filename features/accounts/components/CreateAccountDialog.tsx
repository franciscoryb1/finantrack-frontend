"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AccountForm } from "./AccountForm";
import { useCreateAccount } from "../hooks/useCreateAccount";
import { AccountFormValues } from "../schemas/account.schema";

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false);
  const mutation = useCreateAccount();

  async function handleSubmit(values: AccountFormValues) {
    try {
      await mutation.mutateAsync({
        name: values.name,
        type: values.type,
        currentBalanceCents:
          values.currentBalance !== undefined
            ? Math.round(values.currentBalance * 100)
            : undefined,
      });
      setOpen(false);
    } catch {
      // el toast de error lo muestra el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Nueva cuenta</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear cuenta</DialogTitle>
        </DialogHeader>

        <AccountForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
