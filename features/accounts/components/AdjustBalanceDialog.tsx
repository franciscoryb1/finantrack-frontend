"use client";

import { useState, useMemo } from "react";
import { Account } from "../api/accounts.api";
import { useAdjustBalance } from "../hooks/useAdjustBalance";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { formatCurrency } from "@/lib/utils";
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

type Props = {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AdjustBalanceDialog({ account, open, onOpenChange }: Props) {
  const [newBalance,  setNewBalance]  = useState((account.currentBalanceCents / 100).toFixed(2));
  const [note,        setNote]        = useState("");
  const [parentId,    setParentId]    = useState<number | null>(null);
  const [categoryId,  setCategoryId]  = useState<number | null>(null);

  const mutation = useAdjustBalance();
  const { data: categories = [] } = useCategories();

  const parsed         = parseFloat(newBalance.replace(",", "."));
  const isValid        = !isNaN(parsed) && parsed >= 0;
  const newBalanceCents = isValid ? Math.round(parsed * 100) : 0;
  const diff           = newBalanceCents - account.currentBalanceCents;

  // Filtra categorías según dirección del ajuste
  const categoryType = diff > 0 ? "INCOME" : diff < 0 ? "EXPENSE" : null;
  const visibleParents = useMemo(
    () => categoryType ? categories.filter((c) => c.type === categoryType) : categories,
    [categories, categoryType],
  );

  const selectedParent = useMemo(
    () => categories.find((c) => c.id === parentId) ?? null,
    [categories, parentId],
  );

  function handleParentChange(value: string) {
    const id = value === "NONE" ? null : Number(value);
    setParentId(id);
    setCategoryId(null); // reset subcategory
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    if (diff === 0) { onOpenChange(false); return; }

    // Si el padre no tiene hijos, el categoryId es el padre mismo
    const finalCategoryId = categoryId ?? (selectedParent && selectedParent.children.length === 0 ? selectedParent.id : null) ?? undefined;

    try {
      await mutation.mutateAsync({
        id: account.id,
        newBalanceCents,
        note: note.trim() || undefined,
        categoryId: finalCategoryId ?? undefined,
      });
      onOpenChange(false);
    } catch {
      // error shown by hook
    }
  }

  function handleOpenChange(o: boolean) {
    if (!o) {
      setNewBalance((account.currentBalanceCents / 100).toFixed(2));
      setNote("");
      setParentId(null);
      setCategoryId(null);
    }
    onOpenChange(o);
  }

  const hasSubcats = !!(selectedParent && selectedParent.children.length > 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Ajustar saldo — {account.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label>Saldo actual</Label>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatCurrency(account.currentBalanceCents)}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="new-balance">Nuevo saldo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <Input
                id="new-balance"
                className="pl-7"
                value={newBalance}
                onChange={(e) => { setNewBalance(e.target.value); setParentId(null); setCategoryId(null); }}
                inputMode="decimal"
              />
            </div>
          </div>

          {diff !== 0 && isValid && (
            <p className={`text-sm font-medium ${diff > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
              {diff > 0 ? "+" : ""}{formatCurrency(diff)} respecto al saldo actual
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="note">Nota (opcional)</Label>
            <Input
              id="note"
              placeholder="Ej: Corrección por conteo de efectivo"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Categoría — solo si hay diferencia */}
          {diff !== 0 && isValid && (
            <div className="space-y-2 border-t pt-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
                Categoría (opcional)
              </Label>

              <div className="flex gap-2 min-w-0">
                <Select
                  value={parentId?.toString() ?? "NONE"}
                  onValueChange={handleParentChange}
                >
                  <SelectTrigger className="h-9 flex-1 min-w-0">
                    <SelectValue placeholder="Sin categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Sin categoría</SelectItem>
                    {visibleParents.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        <span className="flex items-center gap-2">
                          {cat.color && (
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          )}
                          {cat.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {hasSubcats && (
                  <Select
                    value={categoryId?.toString() ?? "NONE"}
                    onValueChange={(v) => setCategoryId(v === "NONE" ? null : Number(v))}
                  >
                    <SelectTrigger className="h-9 flex-1 min-w-0">
                      <SelectValue placeholder="Subcategoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin subcategoría</SelectItem>
                      {selectedParent!.children.map((child) => (
                        <SelectItem key={child.id} value={child.id.toString()}>
                          <span className="flex items-center gap-2">
                            {(child.color ?? selectedParent!.color) && (
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: child.color ?? selectedParent!.color ?? undefined }} />
                            )}
                            {child.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || mutation.isPending}>
              {diff === 0 ? "Sin cambios" : "Ajustar saldo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
