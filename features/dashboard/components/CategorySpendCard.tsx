import { Card } from "@/components/ui/card";
import { Tag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SubcategoryTotal = {
  name: string;
  totalCents: number;
};

type Props = {
  categoryName: string;
  totalCents: number;
  subcategories: SubcategoryTotal[];
  loading?: boolean;
};

export function CategorySpendCard({ categoryName, totalCents, subcategories, loading }: Props) {
  return (
    <Card className="p-3 flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{categoryName}</span>
        <Tag className="h-3 w-3 text-muted-foreground" />
      </div>
      {loading ? (
        <div className="space-y-1">
          <div className="h-5 w-20 rounded bg-muted animate-pulse" />
          <div className="h-3 w-16 rounded bg-muted animate-pulse" />
        </div>
      ) : (
        <>
          <p className="text-base font-bold tabular-nums tracking-tight text-red-700 dark:text-red-400">
            {formatCurrency(totalCents)}
          </p>
          {subcategories.length > 0 && (
            <div className="flex flex-col gap-0.5 border-t pt-1.5">
              {subcategories.map((sub) => (
                <div key={sub.name} className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground">{sub.name}</span>
                  <span className="text-[11px] font-medium tabular-nums">{formatCurrency(sub.totalCents)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
