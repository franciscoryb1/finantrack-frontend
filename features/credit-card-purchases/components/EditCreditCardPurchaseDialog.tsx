"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { formatCurrency } from "@/lib/utils";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useUpdateCreditCardPurchase } from "../hooks/useUpdateCreditCardPurchase";
import { useDeleteCreditCardPurchase } from "../hooks/useDeleteCreditCardPurchase";
import { useReassignCreditCardPurchase } from "../hooks/useReassignCreditCardPurchase";
import type { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";

type Props = {
  item: DashboardActivityItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditCreditCardPurchaseDialog({ item, open, onOpenChange }: Props) {
  const purchaseId = item.installmentInfo!.purchaseId;
  const update = useUpdateCreditCardPurchase();
  const del = useDeleteCreditCardPurchase();
  const reassign = useReassignCreditCardPurchase();

  const initialParentCategoryId = item.category?.parent
    ? item.category.parent.id
    : item.category?.id;
  const initialCategoryId = item.category?.id;
  const initialCreditCardId = item.creditCard?.id;

  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(initialParentCategoryId);
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId);
  const [description, setDescription] = useState(item.description ?? "");
  const [creditCardId, setCreditCardId] = useState<number | undefined>(initialCreditCardId);
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: categories } = useCategories("EXPENSE");
  const { data: creditCards } = useCreditCards();

  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];
  const isSubSelected = subCategories.some((c) => c.id === categoryId);

  const cardChanged = creditCardId !== undefined && creditCardId !== initialCreditCardId;
  const anyPending = update.isPending || del.isPending || reassign.isPending;

  function reset() {
    setParentCategoryId(initialParentCategoryId);
    setCategoryId(initialCategoryId);
    setDescription(item.description ?? "");
    setCreditCardId(initialCreditCardId);
    setServerError(null);
  }

  async function handleSubmit() {
    setServerError(null);
    try {
      if (cardChanged) {
        await reassign.mutateAsync({
          id: purchaseId,
          data: { creditCardId: creditCardId! },
        });
        // update category/description separately if also changed
        if (categoryId !== initialCategoryId || description.trim() !== (item.description ?? "")) {
          await update.mutateAsync({
            id: purchaseId,
            data: {
              categoryId: categoryId ?? null,
              description: description.trim() || null,
            },
          });
        }
      } else {
        await update.mutateAsync({
          id: purchaseId,
          data: {
            categoryId: categoryId ?? null,
            description: description.trim() || null,
          },
        });
      }
      onOpenChange(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Editar compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Info de la compra (read-only) */}
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm space-y-0.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-medium tabular-nums">
                {formatCurrency(item.amountCents * item.installmentInfo!.installmentsCount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cuotas</span>
              <span className="font-medium">{item.installmentInfo!.installmentsCount}</span>
            </div>
          </div>

          {serverError && (
            <p className="text-sm text-destructive rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              {serverError}
            </p>
          )}

          {/* Tarjeta */}
          <div className="space-y-1.5">
            <Label>Tarjeta</Label>
            <Select
              value={creditCardId?.toString() ?? ""}
              onValueChange={(val) => setCreditCardId(Number(val))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tarjeta" />
              </SelectTrigger>
              <SelectContent>
                {creditCards?.filter((c) => c.isActive || c.id === initialCreditCardId).map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} ···· {c.cardLast4}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cardChanged && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Se reasignarán todas las cuotas pendientes a la nueva tarjeta.
              </p>
            )}
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <Label>
              Categoría{" "}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <Select
              value={parentCategoryId?.toString() ?? ""}
              onValueChange={(val) => {
                const id = Number(val);
                setParentCategoryId(id);
                setCategoryId(id);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sin categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategoría */}
          {subCategories.length > 0 && (
            <div className="space-y-1.5">
              <Label>
                Subcategoría{" "}
                <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <Select
                value={isSubSelected ? categoryId?.toString() ?? "" : ""}
                onValueChange={(val) => setCategoryId(Number(val))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sin subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-purchase-desc">
              Descripción{" "}
              <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
            </Label>
            <Input
              id="edit-purchase-desc"
              placeholder="Ej: Netflix, Ropa..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-between gap-2 pt-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={anyPending}>
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar compra?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Se eliminarán todas las cuotas pendientes de esta compra. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={async () => {
                      await del.mutateAsync(purchaseId);
                      onOpenChange(false);
                    }}
                  >
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button disabled={anyPending} onClick={handleSubmit}>
                Guardar cambios
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
