import { formatCurrency, cn } from "@/lib/utils";

type Props = {
  spending: Map<string, { totalCents: number; subcategories: Map<string, number> }>;
  loading?: boolean;
};

const PALETTE = [
  { bar: "bg-violet-500", dot: "bg-violet-500" },
  { bar: "bg-blue-500",   dot: "bg-blue-500"   },
  { bar: "bg-amber-500",  dot: "bg-amber-500"  },
  { bar: "bg-emerald-500",dot: "bg-emerald-500"},
  { bar: "bg-rose-400",   dot: "bg-rose-400"   },
  { bar: "bg-cyan-500",   dot: "bg-cyan-500"   },
  { bar: "bg-orange-400", dot: "bg-orange-400" },
  { bar: "bg-pink-500",   dot: "bg-pink-500"   },
] as const;

export function CategorySpendChart({ spending, loading }: Props) {
  const entries = Array.from(spending.entries())
    .map(([name, data]) => ({ name, totalCents: data.totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);

  const totalCents = entries.reduce((s, e) => s + e.totalCents, 0);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-20 rounded bg-muted animate-pulse" />
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
          </div>
          <div className="h-2 rounded-full bg-muted animate-pulse" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted animate-pulse" />
                <div className="h-2.5 w-12 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex justify-between">
                <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
                <div className="h-3.5 w-20 rounded bg-muted animate-pulse" />
              </div>
              <div className="h-1.5 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!entries.length || totalCents === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-center">
        <p className="text-sm font-medium text-muted-foreground">Sin gastos en este período</p>
        <p className="text-xs text-muted-foreground">
          Los gastos aparecerán aquí cuando registres movimientos
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Overview: stacked bar + legend */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Total gastado</span>
          <span className="text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400">
            {formatCurrency(totalCents)}
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden flex gap-px bg-muted">
          {entries.map((entry, i) => (
            <div
              key={entry.name}
              className={cn("h-full transition-all duration-700", PALETTE[i % PALETTE.length].bar)}
              style={{ width: `${(entry.totalCents / totalCents) * 100}%` }}
              title={`${entry.name}: ${formatCurrency(entry.totalCents)}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {entries.map((entry, i) => (
            <div key={entry.name} className="flex items-center gap-1">
              <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", PALETTE[i % PALETTE.length].dot)} />
              <span className="text-[11px] text-muted-foreground">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-border" />

      {/* Individual category bars */}
      <div className="flex flex-col gap-2.5">
        {entries.map((entry, i) => {
          const pct = (entry.totalCents / totalCents) * 100;
          const color = PALETTE[i % PALETTE.length];
          return (
            <div key={entry.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("w-2 h-2 rounded-full shrink-0", color.dot)} />
                  <span className="text-xs font-medium truncate">{entry.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground tabular-nums w-8 text-right">
                    {pct.toFixed(0)}%
                  </span>
                  <span className="text-xs font-semibold tabular-nums w-24 text-right">
                    {formatCurrency(entry.totalCents)}
                  </span>
                </div>
              </div>
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700", color.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
