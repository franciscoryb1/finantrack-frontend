"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useToggleCreditCard } from "@/features/credit-cards/hooks/useToggleCreditCard";
import { useCardPeriods } from "@/features/installments/hooks/useCardPeriods";
import { useCardPeriodDetail } from "@/features/installments/hooks/useCardPeriodDetail";
import { EditCreditCardDialog } from "@/features/credit-cards/components/EditCreditCardDialog";
import { CreateMovementDialog } from "@/features/movements/components/CreateMovementDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatCurrency, cn } from "@/lib/utils";
import { ChevronLeft, Power } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC",
  });
}

const BRAND_COLORS: Record<string, string> = {
  VISA: "#1A1F71",
  MASTERCARD: "#EB001B",
};

function getBrandColor(brand: string | null | undefined) {
  return brand ? (BRAND_COLORS[brand] ?? "#64748b") : "#64748b";
}

function StatementStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    OPEN:   { label: "Abierto",  className: "bg-blue-500 text-white hover:bg-blue-500" },
    CLOSED: { label: "Cerrado",  className: "bg-amber-500 text-white hover:bg-amber-500" },
    PAID:   { label: "Pagado",   className: "bg-green-600 text-white hover:bg-green-600" },
  };
  const cfg = config[status] ?? { label: status, className: "" };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

function InstallmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pendiente", className: "bg-amber-500 text-white hover:bg-amber-500" },
    BILLED:  { label: "Facturada", className: "bg-yellow-500 text-white hover:bg-yellow-500" },
    PAID:    { label: "Pagada",    className: "bg-green-600 text-white hover:bg-green-600" },
  };
  const cfg = config[status] ?? { label: status, className: "" };
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function CreditCardDetailPage() {
  const params = useParams();
  const cardId = Number(params.id);

  const [confirmToggle, setConfirmToggle] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number } | null>(null);

  const { data: cards } = useCreditCards();
  const card = cards?.find((c) => c.id === cardId);
  const toggle = useToggleCreditCard(cardId);

  const { data: periods, isLoading: loadingPeriods } = useCardPeriods(cardId);
  const { data, isLoading: loadingDetail } = useCardPeriodDetail(
    cardId,
    selectedPeriod?.year,
    selectedPeriod?.month,
  );

  useEffect(() => {
    if (!selectedPeriod && periods && periods.length > 0) {
      setSelectedPeriod({ year: periods[0].year, month: periods[0].month });
    }
  }, [periods, selectedPeriod]);

  const isLoading = loadingPeriods || loadingDetail;

  const totalToPay = data?.purchases.reduce(
    (sum, p) => sum + p.installmentForThisPeriod.amountCents,
    0,
  ) ?? 0;

  const brandColor = getBrandColor(card?.brand);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/credit-cards">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Tarjetas
        </Link>
      </Button>

      {/* Card header */}
      <div className="rounded-2xl border overflow-hidden">
        <div className="h-2 w-full" style={{ backgroundColor: brandColor }} />
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{card?.name ?? "Tarjeta"}</h1>
              {card?.brand && (
                <Badge variant="outline" style={{ color: brandColor, borderColor: brandColor }} className="font-bold text-[10px]">
                  {card.brand}
                </Badge>
              )}
              {card && !card.isActive && (
                <Badge variant="secondary">Inactiva</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">···· {card?.cardLast4}</p>
            {card?.bankAccount && (
              <p className="text-xs text-muted-foreground">Débito: {card.bankAccount.name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <CreateMovementDialog
              label="Nueva compra"
              initialValues={{
                type: "EXPENSE",
                paymentMethod: "CREDIT_CARD",
                creditCardId: cardId,
                installmentsCount: 1,
              }}
            />
            {card && <EditCreditCardDialog card={card} />}
            <Button
              variant="ghost"
              size="icon"
              title={card?.isActive ? "Desactivar tarjeta" : "Activar tarjeta"}
              onClick={() => setConfirmToggle(true)}
            >
              <Power className={cn("h-4 w-4", card?.isActive ? "text-green-600" : "text-muted-foreground")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Period selector */}
      {periods && periods.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Período:</span>
          <Select
            value={selectedPeriod ? `${selectedPeriod.year}-${selectedPeriod.month}` : ""}
            onValueChange={(val) => {
              const [y, m] = val.split("-").map(Number);
              setSelectedPeriod({ year: y, month: m });
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={`${p.year}-${p.month}`} value={`${p.year}-${p.month}`}>
                  {MONTHS[p.month - 1]} {p.year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : !data ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No hay resúmenes para esta tarjeta todavía.
        </div>
      ) : (
        <>
          {/* Statement summary */}
          <div
            className="rounded-2xl border p-5 space-y-4"
            style={{ backgroundColor: data.card.backgroundColor ?? undefined }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {MONTHS[data.period.month - 1]} {data.period.year}
              </p>
              <StatementStatusBadge status={data.period.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-2 rounded-xl bg-white/80 dark:bg-slate-950/80 border p-4">
                <p className="text-xs text-muted-foreground">Total a pagar</p>
                <p className="text-2xl font-bold">{formatCurrency(totalToPay)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.purchases.length} compra{data.purchases.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-slate-950/80 border p-4">
                <p className="text-xs text-muted-foreground">Cierre</p>
                <p className="font-semibold text-sm">{formatDate(data.period.closingDate)}</p>
              </div>
              <div className="rounded-xl bg-white/80 dark:bg-slate-950/80 border p-4">
                <p className="text-xs text-muted-foreground">Vencimiento</p>
                <p className="font-semibold text-sm">{formatDate(data.period.dueDate)}</p>
              </div>
            </div>
          </div>

          {/* Purchases list */}
          {data.purchases.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              No hay compras en este período.
            </p>
          ) : (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Compras del período
              </h2>
              {[...data.purchases]
                .sort((a, b) => b.installmentForThisPeriod.amountCents - a.installmentForThisPeriod.amountCents)
                .map((purchase) => {
                  const { installmentNumber, installmentsCount } = {
                    installmentNumber: purchase.installmentForThisPeriod.installmentNumber,
                    installmentsCount: purchase.installmentsCount,
                  };
                  const progressPercent = Math.round((installmentNumber / installmentsCount) * 100);

                  return (
                    <Card key={purchase.purchaseId} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">
                            {purchase.description ?? (
                              <span className="italic text-muted-foreground">Sin descripción</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(purchase.occurredAt)} · {formatCurrency(purchase.totalAmountCents)} total
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-bold">{formatCurrency(purchase.installmentForThisPeriod.amountCents)}</p>
                          <InstallmentStatusBadge status={purchase.installmentForThisPeriod.status} />
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Cuota {installmentNumber} de {installmentsCount}</span>
                          <span>{progressPercent}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* Toggle confirmation dialog */}
      {card && (
        <AlertDialog open={confirmToggle} onOpenChange={setConfirmToggle}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿{card.isActive ? "Desactivar" : "Activar"} "{card.name}"?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {card.isActive
                  ? "La tarjeta quedará inactiva y no podrá usarse en nuevas compras."
                  : "La tarjeta volverá a estar disponible para nuevas compras."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmToggle(false);
                  toggle.mutate(card.isActive);
                }}
              >
                {card.isActive ? "Desactivar" : "Activar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
