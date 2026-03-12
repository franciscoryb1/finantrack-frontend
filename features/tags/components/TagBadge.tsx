"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tag } from "../api/tags.api";

type Props = {
  tag: Tag;
  className?: string;
};

export function TagBadge({ tag, className }: Props) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] h-4 px-1.5 font-normal rounded-full", className)}
      style={
        tag.color
          ? {
              backgroundColor: tag.color + "20",
              borderColor: tag.color + "60",
              color: tag.color,
            }
          : undefined
      }
    >
      {tag.name}
    </Badge>
  );
}
