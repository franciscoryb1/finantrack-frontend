"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useCreditCards } from "@/features/credit-cards/hooks/useCreditCards";
import { useInstallmentsOverview } from "@/features/installments/hooks/useInstallmentsOverview";
import { CreateCreditCardDialog } from "@/features/credit-cards/components/CreateCreditCardDialog";
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

function formatExpiry(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${mm}/${yy}`;
}

function getCardBackground(
  brand: string | null | undefined,
  bg: string | null | undefined,
): CSSProperties {
  const isDefault = !bg || bg === "#ffffff" || bg === "#FFFFFF";
  if (!isDefault) return { background: bg! };
  if (brand === "VISA")
    return { background: "linear-gradient(135deg, #1a1f71 0%, #0d1550 100%)" };
  if (brand === "MASTERCARD")
    return { background: "linear-gradient(135deg, #1a1a2e 0%, #0f0f1a 100%)" };
  return { background: "linear-gradient(135deg, #374151 0%, #111827 100%)" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Chip() {
  return (
    <div
      className="w-10 h-7 rounded-[4px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #d4a843 0%, #f5d682 50%, #b8882e 100%)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
    >
      {/* Chip lines */}
      <div className="w-full h-full flex flex-col justify-between p-[3px]">
        <div className="h-px bg-yellow-900/30 rounded" />
        <div className="flex gap-[2px] flex-1 py-[2px]">
          <div className="w-1/3 rounded-[1px] bg-yellow-900/20" />
          <div className="w-1/3 rounded-[1px] bg-yellow-900/30" />
          <div className="w-1/3 rounded-[1px] bg-yellow-900/20" />
        </div>
        <div className="h-px bg-yellow-900/30 rounded" />
      </div>
    </div>
  );
}

function BrandMark({ brand }: { brand: string | null | undefined }) {
  if (brand === "VISA") {
    return (
      <span
        className="font-black italic text-white text-2xl tracking-tight leading-none"
        style={{ fontFamily: "Georgia, serif", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
      >
        VISA
      </span>
    );
  }
  if (brand === "MASTERCARD") {
    return (
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-red-500 opacity-95" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }} />
        <div className="w-7 h-7 rounded-full bg-orange-400 opacity-90 -ml-3" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
      </div>
    );
  }
  return null;
}

// ── Credit card visual ────────────────────────────────────────────────────────

function CreditCardVisual({
  card,
  backgroundColor,
}: {
  card: CreditCard;
  backgroundColor: string | null | undefined;
}) {
  const bg = getCardBackground(card.brand, backgroundColor);

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{
        ...bg,
        aspectRatio: "1.586",
        boxShadow:
          "0 20px 40px rgba(0,0,0,0.22), 0 6px 16px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.12)",
      }}
    >
      {/* Shine overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 55%, rgba(0,0,0,0.08) 100%)",
        }}
      />

      {/* Top row: chip + bank */}
      <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
        <Chip />
        <div className="text-right space-y-0.5">
          {card.bankAccount?.name && (
            <p className="text-white/50 text-[10px] uppercase tracking-widest leading-none">
              {card.bankAccount.name}
            </p>
          )}
          {!card.isActive && (
            <p className="text-white/40 text-[10px] uppercase tracking-wider">Inactiva</p>
          )}
        </div>
      </div>

      {/* Card number */}
      <div className="absolute inset-x-5" style={{ top: "40%" }}>
        <p
          className="text-white font-mono text-[17px] tracking-[0.22em] font-medium"
          style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
        >
          ···· ···· ···· {card.cardLast4}
        </p>
      </div>

      {/* Bottom row: name + expiry + brand */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
        <div className="space-y-[2px]">
          <p
            className="text-white font-medium text-sm uppercase tracking-wider leading-tight"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
          >
            {card.name}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-white/45 text-[9px] uppercase tracking-widest">Vence</span>
            <span
              className="text-white font-mono text-[13px] tracking-wider"
              style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
            >
              {formatExpiry(card.cardExpiresAt)}
            </span>
          </div>
        </div>
        <BrandMark brand={card.brand} />
      </div>
    </div>
  );
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
          {/* Period + badge */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {MONTHS[ov.openStatement.month - 1]} {ov.openStatement.year}
            </p>
            <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-0 text-[11px] font-medium px-2 h-5">
              Abierto
            </Badge>
          </div>

          {/* Amounts */}
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

          {/* Dates */}
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

      {/* Usage bar */}
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
              <CreditCardVisual card={card} backgroundColor={ov?.backgroundColor ?? null} />
              <StatementInfo card={card} ov={ov} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
