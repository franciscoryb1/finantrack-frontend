"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCardPeriods } from "../hooks/useCardPeriods";
import { useUpdateStatementDates } from "../hooks/useUpdateStatementDates";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  OPEN:   { label: "Abierto", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
  CLOSED: { label: "Cerrado", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
  PAID:   { label: "Pagado", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
};

type Props = {
  cardId: number;
  cardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultYear?: number;
  defaultMonth?: number;
};

export function EditStatementDatesDialog({ cardId, cardName, open, onOpenChange, defaultYear, defaultMonth }: Props) {
  const { data: periods } = useCardPeriods(cardId);
  const updateDates = useUpdateStatementDates(cardId);

  const defaultKey = defaultYear && defaultMonth ? `${defaultYear}-${defaultMonth}` : null;

  const [selectedKey, setSelectedKey] = useState<string>(defaultKey ?? "");
  const [draftClosing, setDraftClosing] = useState("");
  const [draftDue, setDraftDue] = useState("");

  const selectedPeriod = periods?.find((p) => `${p.year}-${p.month}` === selectedKey);
  const canEdit = selectedPeriod?.status === "OPEN";

  // Pre-fill dates when period resolves or changes
  useEffect(() => {
    if (!selectedPeriod) return;
    setDraftClosing(selectedPeriod.closingDate.slice(0, 10));
    setDraftDue(selectedPeriod.dueDate.slice(0, 10));
  }, [selectedPeriod?.id]);

  // Set default period when periods load
  useEffect(() => {
    if (!periods || selectedKey) return;
    const first = periods[0];
    if (first) setSelectedKey(`${first.year}-${first.month}`);
  }, [periods]);

  function handleOpenChange(o: boolean) {
    if (!o) {
      setSelectedKey(defaultKey ?? "");
      setDraftClosing("");
      setDraftDue("");
    }
    onOpenChange(o);
  }

  async function handleSave() {
    if (!selectedPeriod || !canEdit) return;
    try {
      await updateDates.mutateAsync({
        statementId: selectedPeriod.id,
        closingDate: draftClosing ? new Date(draftClosing + "T12:00:00").toISOString() : undefined,
        dueDate: draftDue ? new Date(draftDue + "T12:00:00").toISOString() : undefined,
      });
      onOpenChange(false);
    } catch { /* toast shown by hook */ }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar fechas del resumen</DialogTitle>
          <p className="text-sm text-muted-foreground">{cardName}</p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Selector de período */}
          <div className="space-y-1.5">
            <Label>Período</Label>
            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar período..." />
              </SelectTrigger>
              <SelectContent>
                {(periods ?? []).map((p) => {
                  const cfg = STATUS_LABELS[p.status] ?? { label: p.status, className: "" };
                  return (
                    <SelectItem key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                      <span className="flex items-center gap-2">
                        <span>{MONTHS[p.month - 1]} {p.year}</span>
                        <Badge className={cn("text-[10px] px-1.5 h-4", cfg.className)}>{cfg.label}</Badge>
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedPeriod && !canEdit && (
              <p className="text-xs text-muted-foreground">
                Solo se pueden editar resúmenes con estado <strong>Abierto</strong>.
              </p>
            )}
          </div>

          {/* Fecha de cierre */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-closing">Fecha de cierre</Label>
            <Input
              id="edit-closing"
              type="date"
              value={draftClosing}
              onChange={(e) => setDraftClosing(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          {/* Fecha de vencimiento */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-due">Fecha de vencimiento</Label>
            <Input
              id="edit-due"
              type="date"
              value={draftDue}
              onChange={(e) => setDraftDue(e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!canEdit || updateDates.isPending}
              onClick={handleSave}
            >
              {updateDates.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
