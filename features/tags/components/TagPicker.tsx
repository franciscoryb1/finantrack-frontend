"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check, Plus, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTags } from "../hooks/useTags";
import { useCreateTag } from "../hooks/useCreateTag";

type Props = {
  value: number[];
  onChange: (ids: number[]) => void;
};

export function TagPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: allTags = [] } = useTags();
  const createTag = useCreateTag();

  const selectedTags = allTags.filter((t) => value.includes(t.id));
  const filtered = allTags.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const exactMatch = allTags.find(
    (t) => t.name.toLowerCase() === search.trim().toLowerCase()
  );

  function toggle(tagId: number) {
    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
    } else {
      onChange([...value, tagId]);
    }
  }

  async function handleCreate() {
    const name = search.trim();
    if (!name) return;
    const newTag = await createTag.mutateAsync({ name });
    onChange([...value, newTag.id]);
    setSearch("");
  }

  return (
    <div className="space-y-2">
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="gap-1 pr-1 text-xs rounded-full"
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
              <button
                type="button"
                onClick={() => toggle(tag.id)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setSearch(""); }}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
            <Tag className="h-3.5 w-3.5" />
            Agregar etiqueta
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <Input
            placeholder="Buscar o crear etiqueta..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 mb-2"
          />
          <div className="space-y-0.5 max-h-44 overflow-y-auto">
            {filtered.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggle(tag.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors text-left",
                  value.includes(tag.id) && "bg-muted"
                )}
              >
                <Check
                  className={cn(
                    "h-3 w-3 shrink-0",
                    value.includes(tag.id) ? "opacity-100" : "opacity-0"
                  )}
                />
                <span className="flex-1 truncate">{tag.name}</span>
              </button>
            ))}

            {search.trim() && !exactMatch && (
              <button
                type="button"
                onClick={handleCreate}
                disabled={createTag.isPending}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors text-left text-muted-foreground"
              >
                <Plus className="h-3 w-3 shrink-0" />
                Crear &ldquo;{search.trim()}&rdquo;
              </button>
            )}

            {filtered.length === 0 && !search.trim() && (
              <p className="text-xs text-muted-foreground px-2 py-1.5">
                Sin etiquetas. Escribí para crear una.
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
