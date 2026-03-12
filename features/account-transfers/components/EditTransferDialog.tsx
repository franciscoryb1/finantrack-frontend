"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { TagPicker } from "@/features/tags/components/TagPicker";
import { useUpdateTransfer } from "../hooks/useUpdateTransfer";
import type { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";

type Props = {
  item: DashboardActivityItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditTransferDialog({ item, open, onOpenChange }: Props) {
  const transfer = item.transferData!;
  const updateTransfer = useUpdateTransfer();

  const initialDate = transfer.transferredAt.slice(0, 10);
  const initialAmount = String(transfer.amountCents / 100);
  const initialDescription = transfer.description ?? "";
  const initialTagIds = item.tags?.map((t) => t.id) ?? [];

  const [amount, setAmount] = useState(initialAmount);
  const [date, setDate] = useState(initialDate);
  const [description, setDescription] = useState(initialDescription);
  const [tagIds, setTagIds] = useState<number[]>(initialTagIds);

  function reset() {
    setAmount(initialAmount);
    setDate(initialDate);
    setDescription(initialDescription);
    setTagIds(initialTagIds);
  }

  const amountCents = Math.round(parseFloat(amount || "0") * 100);
  const isValid = amountCents > 0 && date;

  async function handleSubmit() {
    if (!isValid) return;
    const [y, m, d] = date.split("-").map(Number);
    await updateTransfer.mutateAsync({
      id: transfer.id,
      data: {
        amountCents,
        transferredAt: new Date(y, m - 1, d, 12, 0, 0).toISOString(),
        description: description.trim() || undefined,
        tagIds,
      },
    });
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar transferencia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Resumen de cuentas (read-only) */}
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
            <span className="font-medium truncate">{transfer.fromAccount.name}</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="font-medium truncate">{transfer.toAccount.name}</span>
          </div>

          {/* Monto */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-transfer-amount">Monto</Label>
            <Input
              id="edit-transfer-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Monto actual: {formatCurrency(transfer.amountCents)}
            </p>
          </div>

          {/* Fecha */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-transfer-date">Fecha</Label>
            <Input
              id="edit-transfer-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-transfer-desc">
              Descripción{" "}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <Input
              id="edit-transfer-desc"
              placeholder="Ej: Ahorro mensual"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Etiquetas */}
          <div className="space-y-1.5">
            <Label>
              Etiquetas{" "}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <TagPicker value={tagIds} onChange={setTagIds} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!isValid || updateTransfer.isPending}
              onClick={handleSubmit}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
