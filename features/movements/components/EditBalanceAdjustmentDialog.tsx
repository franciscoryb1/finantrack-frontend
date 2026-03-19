"use client";

import { useState, useMemo } from "react";
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
import { useUpdateMovement } from "../hooks/useUpdateMovement";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";
import { formatCurrency } from "@/lib/utils";

type Props = {
  item: DashboardActivityItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditBalanceAdjustmentDialog({ item, open, onOpenChange }: Props) {
  const updateMovement = useUpdateMovement();
  const [serverError, setServerError] = useState<string | null>(null);

  const initialParentId = item.category?.parent
    ? item.category.parent.id
    : item.category?.id ?? null;

  const [parentId, setParentId] = useState<number | null>(initialParentId);
  const [categoryId, setCategoryId] = useState<number | null>(item.category?.id ?? null);
  const [description, setDescription] = useState(item.description ?? "");

  const { data: categories = [] } = useCategories();

  const selectedParent = useMemo(
    () => categories.find((c) => c.id === parentId) ?? null,
    [categories, parentId],
  );
  const hasSubcats = !!(selectedParent && selectedParent.children.length > 0);

  function handleParentChange(value: string) {
    const id = value === "NONE" ? null : Number(value);
    setParentId(id);
    setCategoryId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const finalCategoryId =
      categoryId ??
      (selectedParent && selectedParent.children.length === 0 ? selectedParent.id : null);

    try {
      await updateMovement.mutateAsync({
        id: item.id,
        data: {
          categoryId: finalCategoryId,
          description: description.trim() || null,
        },
      });
      onOpenChange(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setServerError(null);
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar ajuste de saldo</DialogTitle>
        </DialogHeader>

        <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-0.5">
          <p className="text-sm font-medium">{item.description ?? "Ajuste de saldo"}</p>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(item.amountCents)}
            {item.account && <> · {item.account.name}</>}
          </p>
        </div>

        {serverError && (
          <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            {serverError}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="adj-desc">Descripción (opcional)</Label>
            <Input
              id="adj-desc"
              placeholder="Ej: Corrección por conteo de efectivo"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">
              Categoría (opcional)
            </Label>
            <div className="flex gap-2 min-w-0">
              <Select value={parentId?.toString() ?? "NONE"} onValueChange={handleParentChange}>
                <SelectTrigger className="h-9 flex-1 min-w-0">
                  <SelectValue placeholder="Sin categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Sin categoría</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <span className="flex items-center gap-2">
                        {cat.color && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
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
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: child.color ?? selectedParent!.color ?? undefined }}
                            />
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

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMovement.isPending}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
