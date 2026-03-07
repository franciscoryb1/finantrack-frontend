"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useInstallmentsOverview } from "@/features/installments/hooks/useInstallmentsOverview";
import { CreateCreditCardDialog } from "@/features/credit-cards/components/CreateCreditCardDialog";
import { EditCreditCardDialog } from "@/features/credit-cards/components/EditCreditCardDialog";
import { KpiCard } from "@/features/movements/components/KpiCard";
import { CreditCard } from "@/features/credit-cards/api/credit-cards.api";
import { InstallmentsOverview } from "@/features/installments/api/installments.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import { CreditCard as CreditCardIcon, ArrowRight, Wallet, AlertCircle } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

type CardOverview = InstallmentsOverview["cards"][number];

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

// ── Card hub item ─────────────────────────────────────────────────────────────

type CardHubItemProps = {
  card: CreditCard;
  overview: CardOverview | undefined;
};

function CardHubItem({ card, overview }: CardHubItemProps) {
  const brandColor = getBrandColor(card.brand);
  const usedPercent = overview
    ? Math.min(100, Math.round((overview.committedCents / card.limitCents) * 100))
    : 0;

  const usageColor =
    usedPercent >= 90 ? "bg-red-500" :
    usedPercent >= 70 ? "bg-amber-500" :
    "bg-primary";

  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-md", !card.isActive && "opacity-60")}>
      {/* Top color bar */}
      <div className="h-1.5 w-full" style={{ backgroundColor: brandColor }} />

      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-base truncate">{card.name}</span>
              {card.brand && (
                <Badge variant="outline" className="text-[10px] font-bold shrink-0" style={{ color: brandColor, borderColor: brandColor }}>
                  {card.brand}
                </Badge>
              )}
              {!card.isActive && (
                <Badge variant="secondary" className="text-[10px] shrink-0">Inactiva</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">···· {card.cardLast4}</p>
          </div>
          <EditCreditCardDialog card={card} />
        </div>

        {/* Disponible / Límite */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Disponible</span>
            <span>
              {overview ? formatCurrency(overview.availableCents) : "—"} / {formatCurrency(card.limitCents)}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", usageColor)}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">{usedPercent}% utilizado</p>
        </div>

        {/* Statement info */}
        {overview?.openStatement ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm border rounded-lg p-3 bg-muted/40">
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Resumen abierto</p>
              <p className="font-semibold">{formatCurrency(overview.openStatementAccumulatedCents)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Cuotas activas</p>
              <p className="font-semibold">{overview.activeInstallmentsCount}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Cierre</p>
              <p className="font-medium">{formatDate(overview.openStatement.closingDate)}</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Vencimiento</p>
              <p className="font-medium">{formatDate(overview.openStatement.dueDate)}</p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground border rounded-lg p-3 bg-muted/40 text-center">
            Sin resumen abierto
          </div>
        )}

        {/* Ver detalle */}
        <Button asChild variant="outline" className="w-full" size="sm">
          <Link href={`/credit-cards/${card.id}`}>
            Ver cuotas y resúmenes
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function HubSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {[0, 1].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function CreditCardsPage() {
  const { data: cards, isLoading: loadingCards } = useCreditCards();
  const { data: overview, isLoading: loadingOverview } = useInstallmentsOverview();

  const isLoading = loadingCards || loadingOverview;

  const cardsWithOverview = useMemo(() => {
    return (cards ?? []).map((card) => ({
      card,
      overview: overview?.cards.find((c) => c.cardId === card.id),
    }));
  }, [cards, overview]);

  const totalActiveInstallments = useMemo(
    () => overview?.cards.reduce((s, c) => s + c.activeInstallmentsCount, 0) ?? 0,
    [overview],
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Tarjetas de crédito</h1>
        <CreateCreditCardDialog />
      </div>

      {isLoading ? (
        <HubSkeleton />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard
              title="Deuda total"
              value={formatCurrency(overview?.totalDebtCents ?? 0)}
              icon={CreditCardIcon}
              trend="negative"
            />
            <KpiCard
              title="Próximo resumen"
              value={formatCurrency(overview?.totalNextStatementCents ?? 0)}
              icon={AlertCircle}
              trend="neutral"
            />
            <KpiCard
              title="Cuotas activas"
              value={String(totalActiveInstallments)}
              icon={Wallet}
              trend="neutral"
            />
          </div>

          {/* Cards grid */}
          {cardsWithOverview.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground space-y-3">
              <CreditCardIcon className="h-10 w-10 mx-auto opacity-30" />
              <p>No tenés tarjetas creadas todavía.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {cardsWithOverview.map(({ card, overview }) => (
                <CardHubItem key={card.id} card={card} overview={overview} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
