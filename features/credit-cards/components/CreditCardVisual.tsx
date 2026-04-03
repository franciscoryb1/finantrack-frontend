"use client";

import type { CSSProperties } from "react";
import { CreditCard } from "../api/credit-cards.api";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatExpiry(iso: string) {
  const d = new Date(iso);
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(2);
  return `${mm}/${yy}`;
}

export function getCardBackground(
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

/** Color sólido representativo de la tarjeta — mismo orden de prioridad que getCardBackground. */
export function getCardDotColor(
  brand: string | null | undefined,
  bg: string | null | undefined,
): string {
  const isDefault = !bg || bg === "#ffffff" || bg === "#FFFFFF";
  if (!isDefault) return bg!;
  if (brand === "VISA") return "#1a1f71";
  if (brand === "MASTERCARD") return "#eb001b";
  return "#374151";
}

// ── Chip ──────────────────────────────────────────────────────────────────────

function Chip() {
  return (
    <div
      className="w-10 h-7 rounded-[4px] overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #d4a843 0%, #f5d682 50%, #b8882e 100%)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
      }}
    >
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

// ── Brand mark ────────────────────────────────────────────────────────────────

export function BrandMark({ brand }: { brand: string | null | undefined }) {
  if (brand === "VISA") {
    return (
      <svg
        viewBox="0 0 780 500"
        className="h-10 w-auto"
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))" }}
        aria-label="Visa"
      >
        <path
          fill="white"
          d="M293.2 348.7l33.4-195.8h53.4l-33.4 195.8H293.2zm237.1-191.7c-10.6-4-27.2-8.3-47.9-8.3-52.8 0-90 26.6-90.3 64.7-.3 28.2 26.6 43.9 46.9 53.3 20.8 9.7 27.8 15.9 27.7 24.6-.1 13.3-16.6 19.3-32 19.3-21.4 0-32.8-3-50.4-10.3l-6.9-3.1-7.5 43.9c12.5 5.5 35.6 10.3 59.6 10.5 56.3 0 92.8-26.3 93.2-67.1.2-22.3-14-39.3-44.8-53.3-18.7-9.1-30.1-15.1-30-24.3 0-8.1 9.7-16.8 30.6-16.8 17.5-.3 30.1 3.6 40 7.6l4.8 2.2 7.1-41.2zM638.1 152.9h-41.3c-12.8 0-22.3 3.5-27.9 16.4l-79.2 179.4h56l11.2-29.3 68.4.1 6.5 29.3H681l-42.9-195.9zm-64.6 126.6l21.3-54.9 7.9-22.8 4.3 22.5 13.5 55.2h-47zm-331.8-126.6L189.4 286.4l-5.6-27.2c-9.7-31.3-40-65.2-73.9-82.1l47.9 171.5 56.6-.1 84.2-195.6-56.9.5z"
        />
        <path
          fill="#F9A533"
          d="M158.5 152.9H73.2l-.7 4.1c66.5 16.1 110.5 55 128.7 101.7l-18.5-89.7c-3.2-12.2-12.6-15.5-24-15.9-.1-.1-.1-.2-.2-.2z"
        />
      </svg>
    );
  }
  if (brand === "MASTERCARD") {
    return (
      <div className="flex items-center">
        <div
          className="w-9 h-9 rounded-full bg-red-500 opacity-95"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
        />
        <div
          className="w-9 h-9 rounded-full bg-orange-400 opacity-90 -ml-4"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
        />
      </div>
    );
  }
  return null;
}

// ── CreditCardVisual ──────────────────────────────────────────────────────────

function formatShortDate(iso: string) {
  const [, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}`;
}

type Props = {
  card: CreditCard;
  backgroundColor?: string | null;
  className?: string;
  closingDate?: string | null;
  dueDate?: string | null;
};

export function CreditCardVisual({ card, backgroundColor, className, closingDate, dueDate }: Props) {
  const bg = getCardBackground(card.brand, backgroundColor);

  return (
    <div
      className={cn("relative rounded-2xl overflow-hidden select-none", className ?? "w-full")}
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
        <div className="space-y-[3px]">
          <p
            className="text-white font-medium text-sm uppercase tracking-wider leading-tight"
            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
          >
            {card.name}
          </p>
          {closingDate && dueDate ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-white/45 text-[9px] uppercase tracking-widest">Cierre</span>
                <span className="text-white font-mono text-[11px] tracking-wide" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                  {formatShortDate(closingDate)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-white/45 text-[9px] uppercase tracking-widest">Vto.</span>
                <span className="text-white font-mono text-[11px] tracking-wide" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                  {formatShortDate(dueDate)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-white/45 text-[9px] uppercase tracking-widest">Vence</span>
              <span className="text-white font-mono text-[13px] tracking-wider" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                {formatExpiry(card.cardExpiresAt)}
              </span>
            </div>
          )}
        </div>
        <BrandMark brand={card.brand} />
      </div>
    </div>
  );
}
