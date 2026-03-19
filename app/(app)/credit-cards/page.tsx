"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useInstallmentsOverview } from "@/features/installments/hooks/useInstallmentsOverview";
import { CreateCreditCardDialog } from "@/features/credit-cards/components/CreateCreditCardDialog";
import { CreditCardVisual } from "@/features/credit-cards/components/CreditCardVisual";
import { CreditCard } from "@/features/credit-cards/api/credit-cards.api";
import { InstallmentsOverview } from "@/features/installments/api/installments.api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, cn } from "@/lib/utils";
import { CreditCard as CreditCardIcon } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

type CardOverview = InstallmentsOverview["cards"][number];

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

// ── Statement info ────────────────────────────────────────────────────────────

function StatementInfo({ card, ov }: { card: CreditCard; ov: CardOverview | undefined }) {
  const usedPercent = ov
    ? Math.min(100, Math.round((ov.committedCents / card.limitCents) * 100))
    : 0;

  const barColor =
    usedPercent >= 90 ? "bg-red-500" :
    usedPercent >= 70 ? "bg-amber-500" :
    "bg-emerald-500";

  return (
    <div className="pt-4 space-y-3">
      {ov?.openStatement ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {MONTHS[ov.openStatement.month - 1]} {ov.openStatement.year}
            </p>
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-[11px] font-medium px-2 h-5">
              Abierto
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                Acumulado
              </p>
              <p className="text-xl font-bold tabular-nums">
                {formatCurrency(ov.openStatementAccumulatedCents)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
                Disponible
              </p>
              <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {formatCurrency(ov.availableCents)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground mb-0.5">Cierre</p>
              <p className="font-medium">{formatDate(ov.openStatement.closingDate)}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-0.5">Vencimiento</p>
              <p className="font-medium">{formatDate(ov.openStatement.dueDate)}</p>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between py-1">
          <p className="text-sm text-muted-foreground">Sin resumen abierto</p>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">
              Disponible
            </p>
            <p className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {ov ? formatCurrency(ov.availableCents) : formatCurrency(card.limitCents)}
            </p>
          </div>
        </div>
      )}

      <div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[11px] text-muted-foreground">
          <span>{usedPercent}% utilizado</span>
          <span>{formatCurrency(card.limitCents)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="w-full rounded-2xl" style={{ aspectRatio: "1.586" }} />
          <Skeleton className="h-3.5 w-28" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────

export default function CreditCardsPage() {
  useEffect(() => { document.title = "Tarjetas de crédito | Finantrack"; }, []);

  const { data: cards, isLoading: loadingCards } = useCreditCards();
  const { data: overview, isLoading: loadingOverview } = useInstallmentsOverview();

  const isLoading = loadingCards || loadingOverview;

  const cardsWithOverview = useMemo(
    () =>
      (cards ?? []).map((card) => ({
        card,
        ov: overview?.cards.find((c) => c.cardId === card.id),
      })),
    [cards, overview],
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tarjetas</h1>
          {!isLoading && overview && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {cardsWithOverview.length} tarjeta{cardsWithOverview.length !== 1 ? "s" : ""}
              {overview.totalDebtCents > 0 && (
                <> · <span className="text-foreground font-medium">{formatCurrency(overview.totalDebtCents)}</span> comprometido</>
              )}
            </p>
          )}
        </div>
        <CreateCreditCardDialog />
      </div>

      {isLoading ? (
        <PageSkeleton />
      ) : cardsWithOverview.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground space-y-4">
          <CreditCardIcon className="h-12 w-12 mx-auto opacity-20" />
          <p className="text-sm">No tenés tarjetas creadas todavía.</p>
          <CreateCreditCardDialog />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {cardsWithOverview.map(({ card, ov }) => (
            <Link
              key={card.id}
              href={`/credit-cards/${card.id}`}
              className={cn(
                "group block rounded-2xl border bg-card p-4 transition-all duration-200",
                "hover:shadow-xl hover:-translate-y-0.5",
                !card.isActive && "opacity-55",
              )}
            >
              <CreditCardVisual card={card} backgroundColor={card.backgroundColor ?? ov?.backgroundColor ?? null} />
              <StatementInfo card={card} ov={ov} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
