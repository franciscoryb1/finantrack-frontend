import { DashboardActivityItem } from "@/features/dashboard/api/dashboard.api";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  items: DashboardActivityItem[];
  loading?: boolean;
};

function formatDate(iso: string) {
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });
}

function ItemSource({ item }: { item: DashboardActivityItem }) {
  if (item.kind === "CREDIT_CARD_INSTALLMENT" && item.creditCard) {
    return (
      <span className="text-muted-foreground">
        {item.creditCard.name} ···· {item.creditCard.cardLast4}
      </span>
    );
  }
  if (item.account) {
    return <span className="text-muted-foreground">{item.account.name}</span>;
  }
  return null;
}

export function MovementsTable({ items, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground text-sm">
        No hay actividad en este período.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">

      {/* ── Vista mobile ── */}
      <div className="md:hidden divide-y">
        {items.map((item) => (
          <div
            key={`${item.kind}-${item.id}`}
            className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
          >
            {/* Barra lateral de color */}
            <div className={cn(
              "w-1 self-stretch rounded-full shrink-0",
              item.type === "INCOME"
                ? "bg-green-500"
                : "bg-red-500",
            )} />

            {/* Info principal */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm leading-snug truncate">
                {item.description ?? (
                  <span className="italic text-muted-foreground">Sin descripción</span>
                )}
              </p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5 flex-wrap">
                <ItemSource item={item} />
                {item.installmentInfo && (
                  <>
                    <span>·</span>
                    <span>
                      Cuota {item.installmentInfo.installmentNumber}/{item.installmentInfo.installmentsCount}
                    </span>
                  </>
                )}
                {item.category && (
                  <>
                    <span>·</span>
                    <span>{item.category.name}</span>
                  </>
                )}
              </div>
            </div>

            {/* Monto + fecha */}
            <div className="text-right shrink-0">
              <p className={cn(
                "font-semibold tabular-nums text-sm",
                item.type === "INCOME"
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400",
              )}>
                {item.type === "INCOME" ? "+" : "-"}{formatCurrency(item.amountCents)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(item.occurredAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Vista desktop ── */}
      <table className="hidden md:table w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Fecha</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Descripción</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Categoría</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Origen</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Monto</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={`${item.kind}-${item.id}`}
              className="border-b last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {formatDate(item.occurredAt)}
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">
                    {item.description ?? (
                      <span className="text-muted-foreground italic">Sin descripción</span>
                    )}
                  </span>
                  {item.installmentInfo && (
                    <span className="text-xs text-muted-foreground">
                      Cuota {item.installmentInfo.installmentNumber}/{item.installmentInfo.installmentsCount}
                    </span>
                  )}
                </div>
              </td>

              <td className="px-4 py-3">
                {item.category ? (
                  <Badge variant="secondary">{item.category.name}</Badge>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>

              <td className="px-4 py-3">
                <ItemSource item={item} />
              </td>

              <td className={cn(
                "px-4 py-3 text-right font-semibold tabular-nums",
                item.type === "INCOME"
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400",
              )}>
                {item.type === "INCOME" ? "+" : "-"}{formatCurrency(item.amountCents)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
