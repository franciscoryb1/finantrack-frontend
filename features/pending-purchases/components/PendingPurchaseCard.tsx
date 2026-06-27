"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { CreditCard, Pencil, Check } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { ReviewPendingDialog } from "./ReviewPendingDialog";
import { useConfirmPendingPurchase } from "../hooks/useConfirmPendingPurchase";
import { useDiscardPendingPurchase } from "../hooks/useDiscardPendingPurchase";
import type {
  PendingPurchase,
  ParserConfidence,
} from "../api/pending-purchases.api";

const CONFIDENCE_LABEL: Record<ParserConfidence, string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Baja",
};

const CONFIDENCE_CLASS: Record<ParserConfidence, string> = {
  HIGH: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  MEDIUM: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  LOW: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function PendingPurchaseCard({ purchase }: { purchase: PendingPurchase }) {
  const [editOpen, setEditOpen] = useState(false);
  const confirm = useConfirmPendingPurchase();
  const discard = useDiscardPendingPurchase();

  const bank = purchase.rawEmailData?.bank;
  const hasCard = !!purchase.creditCard;
  const busy = confirm.isPending || discard.isPending;

  return (
    <div className="rounded-lg border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Datos */}
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium truncate">
            {purchase.description || "Consumo sin descripción"}
          </span>
          {purchase.parserConfidence && (
            <Badge
              variant="outline"
              className={cn("text-[10px]", CONFIDENCE_CLASS[purchase.parserConfidence])}
            >
              Confianza {CONFIDENCE_LABEL[purchase.parserConfidence]}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
          {bank && <span>{bank}</span>}
          <span>{formatDate(purchase.occurredAt)}</span>
          <span className="inline-flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {hasCard
              ? `${purchase.creditCard!.name} ···· ${purchase.creditCard!.cardLast4}`
              : "Sin tarjeta"}
          </span>
          <span>
            {purchase.category ? purchase.category.name : "Sin categoría"}
          </span>
          {purchase.installmentsCount > 1 && (
            <span>{purchase.installmentsCount} cuotas</span>
          )}
        </div>
      </div>

      {/* Monto */}
      <div className="text-lg font-semibold shrink-0 sm:text-right">
        {formatCurrency(purchase.totalAmountCents)}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          disabled={busy || !hasCard}
          title={!hasCard ? "Asigná una tarjeta con Editar" : undefined}
          onClick={() => confirm.mutate({ id: purchase.id, data: {} })}
        >
          <Check className="h-4 w-4" />
          Confirmar
        </Button>

        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="ghost" disabled={busy}>
              Descartar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Descartar consumo?</AlertDialogTitle>
              <AlertDialogDescription>
                Se va a marcar como descartado y desaparecerá de la bandeja. No
                impacta en tus resúmenes.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => discard.mutate(purchase.id)}
              >
                Descartar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {editOpen && (
        <ReviewPendingDialog
          purchase={purchase}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
