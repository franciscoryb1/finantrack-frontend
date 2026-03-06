"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const CATEGORY_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#eab308", // yellow
  "#84cc16", // lime
  "#22c55e", // green
  "#10b981", // emerald
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
  "#f43f5e", // rose
  "#6b7280", // gray
] as const;

type Props = {
  value: string | null | undefined;
  onChange: (color: string | null) => void;
};

export function ColorPicker({ value, onChange }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-8 w-8 rounded-full p-0 border-2"
          style={value ? { backgroundColor: value, borderColor: value } : undefined}
          title="Elegir color"
        >
          {!value && <span className="text-muted-foreground text-xs">—</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-8 gap-1.5">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              title={color}
              onClick={() => onChange(color)}
              className={cn(
                "h-6 w-6 rounded-full border-2 transition-transform hover:scale-110",
                value === color ? "border-foreground scale-110" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            >
              {value === color && (
                <Check className="h-3 w-3 text-white mx-auto drop-shadow" />
              )}
            </button>
          ))}
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Quitar color
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
