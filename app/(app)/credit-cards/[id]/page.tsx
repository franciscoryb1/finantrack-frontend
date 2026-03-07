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
import { CardPeriodItem } from "@/features/installments/api/getCardPeriods";
import { EditCreditCardDialog } from "@/features/credit-cards/components/EditCreditCardDialog";
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
import { ChevronLeft, Pencil, Power, Lock, CreditCard } from "lucide-react";

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

/**
 * Selecciona el período cuyo rango [periodStartDate, closingDate] contiene hoy.
 * Si ninguno lo contiene, elige el más reciente anterior a hoy como fallback.
 */
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

  // Fallback: más reciente cuyo cierre ya pasó
  const past = [...periods]
    .filter((p) => new Date(p.closingDate) < today)
    .sort((a, b) => new Date(b.closingDate).getTime() - new Date(a.closingDate).getTime());
  if (past.length > 0) return past[0];

  return periods[0];
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
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">
            {purchase.description ?? (
              <span className="italic text-muted-foreground">Sin descripción</span>
            )}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
            <span className="text-xs text-muted-foreground">{formatDate(purchase.occurredAt)}</span>
            {purchase.installmentsCount > 1 && (
              <span className="text-xs text-muted-foreground">· {formatCurrency(purchase.totalAmountCents)} total</span>
            )}
            {purchase.category && (
              <CategoryBadge category={purchase.category} className="text-[10px] h-4 px-1.5" />
            )}
          </div>
        </div>
        <div className="shrink-0 text-right space-y-1">
          <p className="font-bold">{formatCurrency(amountCents)}</p>
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
                <Badge variant="destructive">Inactiva</Badge>
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
              <Power className={cn("h-4 w-4", card?.isActive ? "text-green-600" : "text-destructive")} />
            </Button>
          </div>
        </div>
      </div>

      {/* Period selector */}
      {periods && periods.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Resumen:</span>
          <Select
            value={activePeriod ? `${activePeriod.year}-${activePeriod.month}` : ""}
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
              <div className="flex items-center gap-2">
                <StatementStatusBadge status={data.period.status} />
                {data.period.status === "OPEN" && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      title="Editar fechas del resumen"
                      onClick={() => {
                        setDraftClosing(data.period.closingDate.slice(0, 10));
                        setDraftDue(data.period.dueDate.slice(0, 10));
                        setEditDatesOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      title="Cerrar resumen"
                      onClick={() => setConfirmClose(true)}
                    >
                      <Lock className="h-3 w-3" />
                      Cerrar
                    </Button>
                  </>
                )}
                {data.period.status === "CLOSED" && (
                  <Button
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => setPayStatementOpen(true)}
                  >
                    <CreditCard className="h-3 w-3" />
                    Pagar resumen
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 rounded-xl bg-white/80 dark:bg-slate-950/80 border p-4">
                <p className="text-xs text-muted-foreground">Total a pagar</p>
                <p className="text-2xl font-bold">{formatCurrency(totalToPay)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {installments.length} cuota{installments.length !== 1 ? "s" : ""} · {consumptions.length} consumo{consumptions.length !== 1 ? "s" : ""}
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

          {/* Tabs: Cuotas / Consumos */}
          <Tabs defaultValue="consumptions">
            <TabsList className="w-full">
              <TabsTrigger value="consumptions" className="flex-1">
                Consumos
                {consumptions.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{consumptions.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="installments" className="flex-1">
                Cuotas
                {installments.length > 0 && (
                  <Badge variant="secondary" className="ml-2 text-xs">{installments.length}</Badge>
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
        </>
      )}

      {/* Editar fechas del resumen */}
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
              <Button variant="outline" onClick={() => setEditDatesOpen(false)}>
                Cancelar
              </Button>
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
                  } catch {
                    // toast shown by hook
                  }
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pagar resumen */}
      {data && (
        <PayStatementDialog
          open={payStatementOpen}
          onOpenChange={setPayStatementOpen}
          statementId={data.period.id}
          totalCents={data.period.totalCents}
          cardId={cardId}
        />
      )}

      {/* Cerrar resumen */}
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
              <AlertDialogAction
                onClick={() => {
                  setConfirmClose(false);
                  closeStatement.mutate(data.period.id);
                }}
              >
                Cerrar resumen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Toggle confirmation dialog */}
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
