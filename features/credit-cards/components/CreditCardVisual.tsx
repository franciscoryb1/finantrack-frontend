"use client";

import type { CSSProperties } from "react";
import { CreditCard } from "../api/credit-cards.api";

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
        <div
          className="w-7 h-7 rounded-full bg-red-500 opacity-95"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}
        />
        <div
          className="w-7 h-7 rounded-full bg-orange-400 opacity-90 -ml-3"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
        />
      </div>
    );
  }
  return null;
}

// ── CreditCardVisual ──────────────────────────────────────────────────────────

type Props = {
  card: CreditCard;
  backgroundColor?: string | null;
};

export function CreditCardVisual({ card, backgroundColor }: Props) {
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
