"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useToggleCreditCard } from "@/features/credit-cards/hooks/useToggleCreditCard";
import { useCardPeriods } from "@/features/installments/hooks/useCardPeriods";
import { useCardPeriodDetail } from "@/features/installments/hooks/useCardPeriodDetail";
import { useUpdateStatementDates } from "@/features/installments/hooks/useUpdateStatementDates";
import { useCloseStatement } from "@/features/credit-cards/hooks/useCloseStatement";
import { PayStatementDialog } from "@/features/credit-cards/components/PayStatementDialog";
import { CreditCardVisual } from "@/features/credit-cards/components/CreditCardVisual";
import { CardPeriodItem } from "@/features/installments/api/getCardPeriods";
import type { CardPeriodDetail } from "@/features/installments/api/getCardPeriodDetail";
import { EditCreditCardDialog } from "@/features/credit-cards/components/EditCreditCardDialog";
import { DeleteCreditCardDialog } from "@/features/credit-cards/components/DeleteCreditCardDialog";
import { CreateMovementDialog } from "@/features/movements/components/CreateMovementDialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, cn } from "@/lib/utils";
import { CategoryBadge } from "@/components/category-badge";
import { ChevronLeft, Pencil, Power, Lock, CreditCard, ShoppingBag } from "lucide-react";

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

function findCurrentPeriod(periods: CardPeriodItem[]): CardPeriodItem {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = periods.find((p) => {
    const start = new Date(p.periodStartDate);
    const close = new Date(p.closingDate);
    start.setHours(0, 0, 0, 0);
    close.setHours(23, 59, 59, 999);
    return today >= start && today <= close;
  });
  if (current) return current;
  const past = [...periods]
    .filter((p) => new Date(p.closingDate) < today)
    .sort((a, b) => new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime());
  return past.length > 0 ? past[0] : periods[0];
}

// ── Statement status badge ────────────────────────────────────────────────────

function StatementStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    OPEN: { label: "Abierto", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
    CLOSED: { label: "Cerrado", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
    PAID: { label: "Pagado", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  };
  const cfg = config[status] ?? { label: status, className: "" };
  return <Badge className={cn("text-[11px] font-medium px-2 h-5", cfg.className)}>{cfg.label}</Badge>;
}

function InstallmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Pendiente", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0" },
    BILLED: { label: "Facturada", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0" },
    PAID: { label: "Pagada", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0" },
  };
  const cfg = config[status] ?? { label: status, className: "" };
  return <Badge className={cn("text-[11px] font-medium px-2 h-5", cfg.className)}>{cfg.label}</Badge>;
}

// ── Purchase card ─────────────────────────────────────────────────────────────

type Purchase = {
  purchaseId: number;
  description: string | null;
  occurredAt: string;
  totalAmountCents: number;
  installmentsCount: number;
  category: { id: number; name: string; parent: { id: number; name: string } | null } | null;
  installmentForThisPeriod: { installmentNumber: number; amountCents: number; status: string };
};

function PurchaseCard({ purchase, showProgress }: { purchase: Purchase; showProgress: boolean }) {
  const { installmentNumber, amountCents, status } = purchase.installmentForThisPeriod;
  const progressPercent = Math.round((installmentNumber / purchase.installmentsCount) * 100);

  return (
    <Card className="p-4 space-y-3 border-border/60">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm leading-snug truncate">
            {purchase.description ?? (
              <span className="italic text-muted-foreground">Sin descripción</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mt-1">
            <span className="text-xs text-muted-foreground">{formatDate(purchase.occurredAt)}</span>
            {purchase.installmentsCount > 1 && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-xs text-muted-foreground">{formatCurrency(purchase.totalAmountCents)} total</span>
              </>
            )}
            {purchase.category && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <CategoryBadge category={purchase.category} className="text-[10px] h-4 px-1.5" />
              </>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right space-y-1.5">
          <p className="font-bold text-sm tabular-nums">{formatCurrency(amountCents)}</p>
          <InstallmentStatusBadge status={status} />
        </div>
      </div>

      {showProgress && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Cuota {installmentNumber} de {purchase.installmentsCount}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

function EmptyTab({ message }: { message: string }) {
  return (
    <p className="text-center text-muted-foreground text-sm py-10">{message}</p>
  );
}

// ── Statement card ────────────────────────────────────────────────────────────

type StatementCardProps = {
  data: CardPeriodDetail;
  totalToPay: number;
  installments: Purchase[];
  consumptions: Purchase[];
  onEditDates: () => void;
  onClose: () => void;
  onPay: () => void;
};

function StatementCard({ data, totalToPay, consumptions, installments, onEditDates, onClose, onPay }: StatementCardProps) {
  const { period } = data;
  const isPaid = period.status === "PAID";
  const isClosed = period.status === "CLOSED" || isPaid;

  return (
    <div className="h-full min-h-[180px] rounded-2xl border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-base">
            {MONTHS[period.month - 1]} {period.year}
          </p>
          <StatementStatusBadge status={period.status} />
        </div>
        <div className="flex items-center gap-1.5">
          {!isClosed && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onEditDates}>
              <Pencil className="h-3 w-3" />
              Fechas
            </Button>
          )}
          {!isClosed && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onClose}>
              <Lock className="h-3 w-3" />
              Cerrar
            </Button>
          )}
          {!isPaid && (
            <Button size="sm" className="h-7 text-xs" onClick={onPay}>
              Pagar
            </Button>
          )}
        </div>
      </div>

      {/* Total */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Total a pagar</p>
        <p className="text-3xl font-bold tabular-nums">{formatCurrency(totalToPay)}</p>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Cierre</p>
          <p className="font-medium">{formatDate(period.closingDate)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Vencimiento</p>
          <p className="font-medium">{formatDate(period.dueDate)}</p>
        </div>
      </div>

      {/* Counts */}
      <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t">
        {consumptions.length > 0 && (
          <span className="flex items-center gap-1">
            <ShoppingBag className="h-3 w-3" />
            {consumptions.length} consumo{consumptions.length !== 1 ? "s" : ""}
          </span>
        )}
        {installments.length > 0 && (
          <span className="flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            {installments.length} cuota{installments.length !== 1 ? "s" : ""}
          </span>
        )}
        {consumptions.length === 0 && installments.length === 0 && (
          <span>Sin compras en este resumen</span>
        )}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function CreditCardDetailPage() {
  const params = useParams();
  const cardId = Number(params.id);

  const [confirmToggle, setConfirmToggle] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [payStatementOpen, setPayStatementOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<{ year: number; month: number } | null>(null);
  const [editDatesOpen, setEditDatesOpen] = useState(false);
  const [draftClosing, setDraftClosing] = useState("");
  const [draftDue, setDraftDue] = useState("");

  const updateDates = useUpdateStatementDates(cardId);
  const closeStatement = useCloseStatement(cardId);
  const { data: cards } = useCreditCards();
  const card = cards?.find((c) => c.id === cardId);
  const toggle = useToggleCreditCard(cardId);

  const { data: periods, isLoading: loadingPeriods } = useCardPeriods(cardId);

  const activePeriod = useMemo(() => {
    if (selectedPeriod) return selectedPeriod;
    if (!periods || periods.length === 0) return null;
    const current = findCurrentPeriod(periods);
    return { year: current.year, month: current.month };
  }, [selectedPeriod, periods]);

  const { data, isLoading: loadingDetail } = useCardPeriodDetail(
    cardId,
    activePeriod?.year,
    activePeriod?.month,
  );

  const isLoading = loadingPeriods || loadingDetail;

  const sortedPurchases = [...(data?.purchases ?? [])].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const installments = sortedPurchases.filter((p) => p.installmentsCount > 1);
  const consumptions = sortedPurchases.filter((p) => p.installmentsCount === 1);

  const totalToPay = sortedPurchases.reduce(
    (sum, p) => sum + p.installmentForThisPeriod.amountCents, 0,
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/credit-cards">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Tarjetas
        </Link>
      </Button>

      {/* ── Hero: card visual (izq) + selector + resumen (der) ── */}
      <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-4 md:gap-6 md:items-stretch">

        {/* ── Columna izquierda: tarjeta + botones ── */}
        <div className="flex flex-col gap-3">
          {card ? (
            <CreditCardVisual
              card={card}
              backgroundColor={data?.card.backgroundColor ?? card.backgroundColor ?? null}
            />
          ) : (
            <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "1.586" }} />
          )}
          <div className="flex items-center gap-2 justify-end flex-wrap">
            <CreateMovementDialog
              label="Nueva compra"
              initialValues={{ type: "EXPENSE", paymentMethod: "CREDIT_CARD", creditCardId: cardId, installmentsCount: 1 }}
            />  
            {card && <EditCreditCardDialog card={card} />}
            <Button
              variant="outline"
              size="icon"
              title={card?.isActive ? "Desactivar tarjeta" : "Activar tarjeta"}
              onClick={() => setConfirmToggle(true)}
            >
              <Power className={cn("h-4 w-4", card?.isActive ? "text-emerald-600" : "text-destructive")} />
            </Button>
            {card && <DeleteCreditCardDialog cardId={card.id} cardName={card.name} />}
          </div>

          <div className="flex items-center gap-2 justify-end flex-wrap">
                    
          </div>
        </div>

        {/* ── Columna derecha: selector de período + detalle ── */}
        <div className="flex flex-col gap-3">
          {/* Selector de período */}
          {periods && periods.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground shrink-0">Resumen</span>
              <Select
                value={activePeriod ? `${activePeriod.year}-${activePeriod.month}` : ""}
                onValueChange={(val) => {
                  const [y, m] = val.split("-").map(Number);
                  setSelectedPeriod({ year: y, month: m });
                }}
              >
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
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

          {/* Detalle del resumen — crece para llenar la altura restante */}
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="h-full min-h-[180px] rounded-2xl border bg-card p-5 flex flex-col gap-4 animate-pulse">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-8 w-44" />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </div>
            ) : !data ? (
              <div className="h-full min-h-[120px] flex items-center justify-center rounded-2xl border bg-card text-muted-foreground text-sm">
                No hay resúmenes para esta tarjeta todavía.
              </div>
            ) : (
              <StatementCard
                data={data}
                totalToPay={totalToPay}
                installments={installments}
                consumptions={consumptions}
                onEditDates={() => {
                  setDraftClosing(data.period.closingDate.slice(0, 10));
                  setDraftDue(data.period.dueDate.slice(0, 10));
                  setEditDatesOpen(true);
                }}
                onClose={() => setConfirmClose(true)}
                onPay={() => setPayStatementOpen(true)}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs: Consumos / Cuotas (ancho completo) ── */}
      {!isLoading && data && (
        <Tabs defaultValue="consumptions">
          <TabsList className="w-full">
            <TabsTrigger value="consumptions" className="flex-1 gap-1.5">
              <ShoppingBag className="h-3.5 w-3.5" />
              Consumos
              {consumptions.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5">{consumptions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="installments" className="flex-1 gap-1.5">
              <CreditCard className="h-3.5 w-3.5" />
              Cuotas
              {installments.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4 px-1.5">{installments.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consumptions" className="mt-4 space-y-3">
            {consumptions.length === 0 ? (
              <EmptyTab message="No hay consumos en este resumen." />
            ) : (
              consumptions.map((p) => (
                <PurchaseCard key={p.purchaseId} purchase={p} showProgress={false} />
              ))
            )}
          </TabsContent>

          <TabsContent value="installments" className="mt-4 space-y-3">
            {installments.length === 0 ? (
              <EmptyTab message="No hay cuotas en este resumen." />
            ) : (
              installments.map((p) => (
                <PurchaseCard key={p.purchaseId} purchase={p} showProgress />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ── Editar fechas ── */}
      <Dialog open={editDatesOpen} onOpenChange={setEditDatesOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar fechas del resumen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="closing-date">Fecha de cierre</Label>
              <Input
                id="closing-date"
                type="date"
                value={draftClosing}
                onChange={(e) => setDraftClosing(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="due-date">Fecha de vencimiento</Label>
              <Input
                id="due-date"
                type="date"
                value={draftDue}
                onChange={(e) => setDraftDue(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setEditDatesOpen(false)}>Cancelar</Button>
              <Button
                disabled={updateDates.isPending}
                onClick={async () => {
                  if (!data) return;
                  try {
                    await updateDates.mutateAsync({
                      statementId: data.period.id,
                      closingDate: draftClosing ? new Date(draftClosing + "T12:00:00").toISOString() : undefined,
                      dueDate: draftDue ? new Date(draftDue + "T12:00:00").toISOString() : undefined,
                    });
                    setEditDatesOpen(false);
                  } catch { /* toast shown by hook */ }
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Pagar resumen ── */}
      {data && (
        <PayStatementDialog
          open={payStatementOpen}
          onOpenChange={setPayStatementOpen}
          statementId={data.period.id}
          totalCents={data.period.totalCents}
          cardId={cardId}
        />
      )}

      {/* ── Cerrar resumen ── */}
      {data && (
        <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cerrar este resumen?</AlertDialogTitle>
              <AlertDialogDescription>
                Se calcularán los totales del período y el resumen pasará a estado{" "}
                <strong>Cerrado</strong>. No se podrán agregar ni quitar compras del período.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setConfirmClose(false); closeStatement.mutate(data.period.id); }}>
                Cerrar resumen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* ── Toggle tarjeta ── */}
      {card && (
        <AlertDialog open={confirmToggle} onOpenChange={setConfirmToggle}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                ¿{card.isActive ? "Desactivar" : "Activar"} &ldquo;{card.name}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {card.isActive
                  ? "La tarjeta quedará inactiva y no podrá usarse en nuevas compras."
                  : "La tarjeta volverá a estar disponible para nuevas compras."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setConfirmToggle(false); toggle.mutate(card.isActive); }}>
                {card.isActive ? "Desactivar" : "Activar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
