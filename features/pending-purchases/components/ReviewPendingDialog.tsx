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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { getCardDotColor } from "@/features/credit-cards/components/CreditCardVisual";
import { useConfirmPendingPurchase } from "../hooks/useConfirmPendingPurchase";
import type { PendingPurchase } from "../api/pending-purchases.api";

type Props = {
  purchase: PendingPurchase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReviewPendingDialog({ purchase, open, onOpenChange }: Props) {
  const confirm = useConfirmPendingPurchase();

  const initialParentCategoryId =
    purchase.category?.parent?.id ?? purchase.category?.id;
  const initialCategoryId = purchase.category?.id;

  const [creditCardId, setCreditCardId] = useState<number | undefined>(
    purchase.creditCard?.id,
  );
  const [parentCategoryId, setParentCategoryId] = useState<number | undefined>(
    initialParentCategoryId,
  );
  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategoryId,
  );
  const [totalAmount, setTotalAmount] = useState<number | undefined>(
    purchase.totalAmountCents / 100,
  );
  const [installmentsCount, setInstallmentsCount] = useState<number>(
    purchase.installmentsCount,
  );
  const [description, setDescription] = useState(purchase.description ?? "");
  const [serverError, setServerError] = useState<string | null>(null);

  const { data: categories } = useCategories("EXPENSE");
  const { data: creditCards } = useCreditCards();

  const selectedParent = categories?.find((c) => c.id === parentCategoryId);
  const subCategories = selectedParent?.children ?? [];
  const isSubSelected = subCategories.some((c) => c.id === categoryId);

  async function handleConfirm() {
    setServerError(null);

    if (!creditCardId) {
      setServerError("Seleccioná una tarjeta para confirmar el consumo");
      return;
    }
    if (!totalAmount || totalAmount <= 0) {
      setServerError("Ingresá un monto válido");
      return;
    }

    try {
      await confirm.mutateAsync({
        id: purchase.id,
        data: {
          creditCardId,
          categoryId: categoryId,
          totalAmountCents: Math.round(totalAmount * 100),
          installmentsCount,
          description: description.trim() || undefined,
        },
      });
      onOpenChange(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Error inesperado");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 flex flex-col max-h-[90dvh] w-[calc(100vw-2rem)] sm:w-auto sm:max-w-sm">
        <DialogHeader className="px-6 pb-4 border-b shrink-0">
          <DialogTitle>Revisar consumo</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Monto y cuotas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pending-total">Total</Label>
              <CurrencyInput
                id="pending-total"
                value={totalAmount}
                onChange={setTotalAmount}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pending-installments">Cuotas</Label>
              <Input
                id="pending-installments"
                type="number"
                min={1}
                max={60}
                value={installmentsCount}
                onChange={(e) =>
                  setInstallmentsCount(Math.max(1, parseInt(e.target.value) || 1))
                }
              />
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
                {creditCards
                  ?.filter((c) => c.isActive)
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{
                            background: getCardDotColor(
                              c.brand,
                              c.backgroundColor,
                            ),
                          }}
                        />
                        {c.name} ···· {c.cardLast4}
                      </span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Categoría */}
          <div className="space-y-1.5">
            <Label>
              Categoría{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (opcional)
              </span>
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
                <span className="text-muted-foreground font-normal text-xs">
                  (opcional)
                </span>
              </Label>
              <Select
                value={isSubSelected ? (categoryId?.toString() ?? "") : ""}
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
            <Label htmlFor="pending-desc">Descripción / comercio</Label>
            <Input
              id="pending-desc"
              placeholder="Ej: Netflix, Spotify..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="shrink-0 px-6 pt-3 pb-4 border-t flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button size="sm" disabled={confirm.isPending} onClick={handleConfirm}>
            Confirmar consumo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
