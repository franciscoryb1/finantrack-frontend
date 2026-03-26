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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, formatCurrency } from "@/lib/utils";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useAccounts } from "@/features/accounts/hooks/useAccounts";
import { useUpdateCreditCardPurchase } from "../hooks/useUpdateCreditCardPurchase";
import { useDeleteCreditCardPurchase } from "../hooks/useDeleteCreditCardPurchase";
import { useReassignCreditCardPurchase } from "../hooks/useReassignCreditCardPurchase";
import { TagPicker } from "@/features/tags/components/TagPicker";
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

  // Reintegro inicial desde installmentInfo
  const initialReimbursementEnabled = !!(item.installmentInfo?.reimbursementAmountCents);
  const initialReimbursementAmount = item.installmentInfo?.reimbursementAmountCents
    ? item.installmentInfo.reimbursementAmountCents / 100
    : undefined;
  const initialReimbursementAccountId = item.installmentInfo?.reimbursementAccountId ?? undefined;
  const today = new Date().toISOString().split("T")[0];
  const initialReimbursementAt = item.installmentInfo?.reimbursementAt?.slice(0, 10) ?? today;

  // Gasto compartido inicial
  const initialSharedExpenseEnabled = !!(item.sharedExpense?.sharedAmountCents);
  const initialSharedAmountCents = item.sharedExpense?.sharedAmountCents
    ? item.sharedExpense.sharedAmountCents / 100
    : undefined;

  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(initialParentCategoryId);
  const [categoryId, setCategoryId] = useState<number | undefined>(initialCategoryId);
  const [description, setDescription] = useState(item.description ?? "");
  const [tagIds, setTagIds] = useState<number[]>(item.tags?.map((t) => t.id) ?? []);
  const [creditCardId, setCreditCardId] = useState<number | undefined>(initialCreditCardId);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reintegro
  const [reimbursementEnabled, setReimbursementEnabled] = useState(initialReimbursementEnabled);
  const [reimbursementAmount, setReimbursementAmount] = useState<number | undefined>(initialReimbursementAmount);
  const [reimbursementAccountId, setReimbursementAccountId] = useState<number | undefined>(initialReimbursementAccountId);
  const [reimbursementAt, setReimbursementAt] = useState(initialReimbursementAt);

  // Gasto compartido
  const [sharedExpenseEnabled, setSharedExpenseEnabled] = useState(initialSharedExpenseEnabled);
  const [sharedAmountCentsInput, setSharedAmountCentsInput] = useState<number | undefined>(initialSharedAmountCents);

  const { data: categories } = useCategories("EXPENSE");
  const { data: creditCards } = useCreditCards();
  const { data: allAccounts } = useAccounts();
  const accounts = (allAccounts ?? []).filter((a) => a.type !== "CREDIT_CARD" && a.isActive);

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
    setReimbursementEnabled(initialReimbursementEnabled);
    setReimbursementAmount(initialReimbursementAmount);
    setReimbursementAccountId(initialReimbursementAccountId);
    setReimbursementAt(initialReimbursementAt);
    setSharedExpenseEnabled(initialSharedExpenseEnabled);
    setSharedAmountCentsInput(initialSharedAmountCents);
    setTagIds(item.tags?.map((t) => t.id) ?? []);
  }

  async function handleSubmit() {
    setServerError(null);

    // Calcular payload de reintegro
    let reimbursementPayload: {
      reimbursementAmountCents?: number | null;
      reimbursementAccountId?: number | null;
      reimbursementAt?: string | null;
    } = {};

    if (!reimbursementEnabled && initialReimbursementEnabled) {
      // Se eliminó el reintegro
      reimbursementPayload = {
        reimbursementAmountCents: null,
        reimbursementAccountId: null,
        reimbursementAt: null,
      };
    } else if (reimbursementEnabled) {
      const amountChanged = reimbursementAmount !== initialReimbursementAmount;
      const accountChanged = reimbursementAccountId !== initialReimbursementAccountId;
      const dateChanged = reimbursementAt !== initialReimbursementAt;

      if (amountChanged || accountChanged || dateChanged || !initialReimbursementEnabled) {
        if (!reimbursementAmount || !reimbursementAccountId) {
          setServerError("Completá el monto y la cuenta del reintegro");
          return;
        }
        const reimbAt = reimbursementAt
          ? (() => { const [ry, rm, rd] = reimbursementAt.split("-").map(Number); return new Date(ry, rm - 1, rd, 12, 0, 0).toISOString(); })()
          : undefined;
        reimbursementPayload = {
          reimbursementAmountCents: Math.round(reimbursementAmount * 100),
          reimbursementAccountId,
          reimbursementAt: reimbAt ?? null,
        };
      }
    }

    // Calcular payload de gasto compartido
    let sharedPayload: { sharedAmountCents?: number | null } = {};
    if (!sharedExpenseEnabled && initialSharedExpenseEnabled) {
      sharedPayload = { sharedAmountCents: null };
    } else if (sharedExpenseEnabled && sharedAmountCentsInput) {
      const newSharedCents = Math.round(sharedAmountCentsInput * 100);
      if (newSharedCents !== item.sharedExpense?.sharedAmountCents) {
        sharedPayload = { sharedAmountCents: newSharedCents };
      }
    }

    try {
      if (cardChanged) {
        await reassign.mutateAsync({
          id: purchaseId,
          data: { creditCardId: creditCardId! },
        });
        if (categoryId !== initialCategoryId || description.trim() !== (item.description ?? "") || Object.keys(reimbursementPayload).length > 0 || Object.keys(sharedPayload).length > 0) {
          await update.mutateAsync({
            id: purchaseId,
            data: {
              categoryId: categoryId ?? null,
              description: description.trim() || null,
              tagIds,
              ...reimbursementPayload,
              ...sharedPayload,
            },
          });
        }
      } else {
        await update.mutateAsync({
          id: purchaseId,
          data: {
            categoryId: categoryId ?? null,
            description: description.trim() || null,
            tagIds,
            ...reimbursementPayload,
            ...sharedPayload,
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
      <DialogContent className={cn(
        "p-0 gap-0 max-h-[90vh] sm:max-h-none",
        reimbursementEnabled ? "sm:max-w-2xl" : "sm:max-w-sm"
      )}>
        <DialogHeader className="px-6 pb-4 border-b shrink-0">
          <DialogTitle>Editar compra</DialogTitle>
        </DialogHeader>

        <div className={cn("flex-1 overflow-y-auto sm:overflow-visible px-6 py-4")}>
        <div className={cn(reimbursementEnabled ? "sm:flex sm:gap-6 sm:items-start" : "space-y-4")}>
          {/* Columna izquierda: campos principales */}
          <div className={cn("space-y-4", reimbursementEnabled && "sm:flex-1")}>
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
              {item.installmentInfo?.reimbursementAmountCents && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reintegro</span>
                  <span className="font-medium text-green-600 tabular-nums">
                    +{formatCurrency(item.installmentInfo.reimbursementAmountCents)}
                  </span>
                </div>
              )}
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

            {/* Tags */}
            <div className="space-y-1.5">
              <Label>
                Etiquetas{" "}
                <span className="text-muted-foreground font-normal text-xs">(opcional)</span>
              </Label>
              <TagPicker value={tagIds} onChange={setTagIds} />
            </div>

            {/* Toggle reintegro (siempre visible en columna izquierda) */}
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Reintegro</p>
                  <p className="text-xs text-muted-foreground">Cashback o promoción bancaria</p>
                </div>
                <Switch
                  checked={reimbursementEnabled}
                  onCheckedChange={(checked) => {
                    setReimbursementEnabled(checked);
                    if (!checked) {
                      setReimbursementAmount(undefined);
                      setReimbursementAccountId(undefined);
                      setReimbursementAt(today);
                    } else if (!reimbursementAt) {
                      setReimbursementAt(today);
                    }
                  }}
                />
              </div>

              {/* Campos de reintegro en mobile (inline bajo el toggle) */}
              {reimbursementEnabled && (
                <div className="sm:hidden mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Monto ($)</Label>
                      <CurrencyInput
                        value={reimbursementAmount}
                        onChange={setReimbursementAmount}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Fecha</Label>
                      <Input
                        type="date"
                        value={reimbursementAt}
                        onChange={(e) => setReimbursementAt(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cuenta de acreditación</Label>
                    <Select
                      value={reimbursementAccountId?.toString() ?? ""}
                      onValueChange={(val) => setReimbursementAccountId(Number(val))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="¿En qué cuenta?" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            <span>{a.name}</span>
                            <span className="ml-2 text-muted-foreground text-xs">
                              {formatCurrency(a.currentBalanceCents)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* Gasto compartido */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Es gasto compartido</p>
                  <p className="text-xs text-muted-foreground">Parte del gasto la paga otra persona</p>
                </div>
                <Switch
                  checked={sharedExpenseEnabled}
                  onCheckedChange={(checked) => {
                    setSharedExpenseEnabled(checked);
                    if (!checked) setSharedAmountCentsInput(undefined);
                  }}
                />
              </div>
              {sharedExpenseEnabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Monto compartido ($)</Label>
                  <CurrencyInput
                    value={sharedAmountCentsInput}
                    onChange={setSharedAmountCentsInput}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha: panel de reintegro (solo desktop) */}
          {reimbursementEnabled && (
            <div className="hidden sm:flex sm:flex-col sm:gap-3 sm:w-56 sm:border-l sm:pl-6 sm:pt-0">
              <p className="text-sm font-medium">Datos del reintegro</p>
              <div className="space-y-1.5">
                <Label className="text-xs">Monto ($)</Label>
                <CurrencyInput
                  value={reimbursementAmount}
                  onChange={setReimbursementAmount}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fecha de acreditación</Label>
                <Input
                  type="date"
                  value={reimbursementAt}
                  onChange={(e) => setReimbursementAt(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Cuenta de acreditación</Label>
                <Select
                  value={reimbursementAccountId?.toString() ?? ""}
                  onValueChange={(val) => setReimbursementAccountId(Number(val))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="¿En qué cuenta?" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id.toString()}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-4 border-t flex items-center justify-between gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={anyPending}>
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
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button size="sm" disabled={anyPending} onClick={handleSubmit}>
              Guardar cambios
            </Button>
          </div>
        </div>
        </DialogContent>
    </Dialog>
  );
}
