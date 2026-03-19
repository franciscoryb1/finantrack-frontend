import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "positive" | "negative" | "neutral";
  loading?: boolean;
};

export function KpiCard({ title, value, subtitle, icon: Icon, trend = "neutral", loading }: Props) {
  return (
    <Card className="p-4 sm:p-5 flex flex-col gap-2 sm:gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <div className={cn(
          "p-2 rounded-lg",
          trend === "positive" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
          trend === "negative" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
          trend === "neutral" && "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      {loading ? (
        <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
      ) : (
        <p className={cn(
          "text-base sm:text-xl md:text-2xl font-bold tracking-tight break-all",
          trend === "positive" && "text-green-700 dark:text-green-400",
          trend === "negative" && "text-red-700 dark:text-red-400",
        )}>
          {value}
        </p>
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      )}
    </Card>
  );
}
