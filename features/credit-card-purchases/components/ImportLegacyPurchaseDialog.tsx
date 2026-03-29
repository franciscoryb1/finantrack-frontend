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

      <DialogContent className="p-0 gap-0 flex flex-col max-h-[90dvh] w-[calc(100vw-2rem)] sm:w-auto sm:max-w-lg">
        <DialogHeader className="px-6 pb-4 border-b shrink-0">
          <DialogTitle>Cargar compra en cuotas anterior</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <LegacyPurchaseForm onSubmit={handleSubmit} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
