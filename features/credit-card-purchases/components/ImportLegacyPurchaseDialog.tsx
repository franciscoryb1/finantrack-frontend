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
import { History } from "lucide-react";
import { LegacyPurchaseForm } from "./LegacyPurchaseForm";
import { useImportLegacyPurchase } from "../hooks/useImportLegacyPurchase";
import { LegacyPurchaseFormValues } from "../schemas/legacy-purchase.schema";

export function ImportLegacyPurchaseDialog() {
  const [open, setOpen] = useState(false);
  const importLegacy = useImportLegacyPurchase();

  async function handleSubmit(values: LegacyPurchaseFormValues) {
    const [y, m, d] = values.occurredAt.split("-").map(Number);
    const occurredAt = new Date(y, m - 1, d, 12, 0, 0).toISOString();

    try {
      await importLegacy.mutateAsync({
        creditCardId: values.creditCardId,
        totalAmountCents: Math.round(values.amount * 100),
        installmentsCount: values.installmentsCount,
        paidInstallmentsCount: values.paidInstallmentsCount,
        occurredAt,
        categoryId: values.categoryId,
        description: values.description || undefined,
        firstStatementYear: values.firstStatementYear,
        firstStatementMonth: values.firstStatementMonth,
      });
      setOpen(false);
    } catch {
      // el toast de error lo muestra el hook
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <History className="h-4 w-4 mr-1" />
          Cuotas anteriores
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cargar compra en cuotas anterior</DialogTitle>
        </DialogHeader>

        <LegacyPurchaseForm onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  );
}
