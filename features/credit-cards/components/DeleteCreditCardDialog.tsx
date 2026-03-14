"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { getCreditCardDeletePreview } from "../api/credit-cards.api";
import { useDeleteCreditCard } from "../hooks/useDeleteCreditCard";

type Props = {
  cardId: number;
  cardName: string;
};

export function DeleteCreditCardDialog({ cardId, cardName }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const deleteMutation = useDeleteCreditCard();

  const { data: preview, isLoading } = useQuery({
    queryKey: ["credit-card-delete-preview", cardId],
    queryFn: () => getCreditCardDeletePreview(cardId),
    enabled: open,
    retry: false,
  });

  async function handleDelete() {
    await deleteMutation.mutateAsync(cardId);
    setOpen(false);
    router.push("/credit-cards");
  }

  const hasData = preview && (
    preview.purchasesCount > 0 ||
    preview.statementsCount > 0 ||
    preview.installmentsCount > 0 ||
    preview.paymentsCount > 0
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        title="Eliminar tarjeta"
        className="text-destructive hover:text-destructive hover:border-destructive/50"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar tarjeta "{cardName}"
            </AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">
              Esta acción es <strong className="text-foreground">permanente e irreversible</strong>.
              Se eliminará la tarjeta y <strong className="text-foreground">todo su historial</strong>:
            </p>

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : preview ? (
              <ul className="space-y-1.5 rounded-lg border bg-muted/40 px-4 py-3">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Resúmenes</span>
                  <span className="font-semibold">{preview.statementsCount}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Compras / gastos</span>
                  <span className="font-semibold">{preview.purchasesCount}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Cuotas</span>
                  <span className="font-semibold">{preview.installmentsCount}</span>
                </li>
                {preview.paymentsCount > 0 && (
                  <li className="flex justify-between">
                    <span className="text-muted-foreground">Pagos de resumen</span>
                    <span className="font-semibold">{preview.paymentsCount}</span>
                  </li>
                )}
              </ul>
            ) : null}

            {!isLoading && !hasData && (
              <p className="text-muted-foreground italic">Esta tarjeta no tiene historial asociado.</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={isLoading || deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar tarjeta"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
