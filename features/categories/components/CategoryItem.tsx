"use client";

import { useState } from "react";
import { Category, CategoryChild } from "../api/categories.api";
import { useToggleCategory } from "../hooks/useToggleCategory";
import { useUpdateCategory } from "../hooks/useUpdateCategory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCategoryDialog } from "./CreateCategoryDialog";

// ── Editor de nombre inline ───────────────────────────────────────────────────

type InlineEditProps = {
  value: string;
  onSave: (v: string) => Promise<void>;
  onCancel: () => void;
};

function InlineEdit({ value, onSave, onCancel }: InlineEditProps) {
  const [name, setName] = useState(value);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed === value) {
      onCancel();
      return;
    }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="h-7 text-sm"
        autoFocus
        disabled={saving}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
          if (e.key === "Escape") onCancel();
        }}
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        disabled={saving}
        onClick={handleSave}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        disabled={saving}
        onClick={onCancel}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

// ── Fila de subcategoría ──────────────────────────────────────────────────────

function ChildRow({ child }: { child: CategoryChild }) {
  const [editing, setEditing] = useState(false);
  const toggle = useToggleCategory();
  const update = useUpdateCategory();
  const isGlobal = child.userId === null;

  async function handleSave(name: string) {
    await update.mutateAsync({ id: child.id, name });
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-md ml-6 border-l-2 border-muted",
        !child.isActive && "opacity-50"
      )}
    >
      {editing ? (
        <InlineEdit
          value={child.name}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <>
          <span className="text-sm flex-1 min-w-0 truncate">{child.name}</span>
          <div className="flex items-center gap-1 shrink-0">
            {isGlobal && (
              <Badge variant="outline" className="text-[10px]">
                Global
              </Badge>
            )}
            {!child.isActive && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Inactiva
              </Badge>
            )}
          </div>
        </>
      )}

      {!editing && !isGlobal && (
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Renombrar"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            disabled={toggle.isPending}
            onClick={() => toggle.mutate({ id: child.id, activate: !child.isActive })}
          >
            {child.isActive ? "Desactivar" : "Activar"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Categoría padre ───────────────────────────────────────────────────────────

type Props = {
  category: Category;
};

export function CategoryItem({ category }: Props) {
  const [editing, setEditing] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const toggle = useToggleCategory();
  const update = useUpdateCategory();
  const isGlobal = category.userId === null;

  async function handleSave(name: string) {
    await update.mutateAsync({ id: category.id, name });
    setEditing(false);
  }

  return (
    <div
      className={cn(
        "border rounded-lg p-3 space-y-1 bg-card",
        !category.isActive && "opacity-60"
      )}
    >
      {/* Fila padre */}
      <div className="flex items-center gap-2 min-h-[2rem]">
        {editing ? (
          <InlineEdit
            value={category.name}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <span className="font-semibold flex-1 min-w-0 truncate">
              {category.name}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {isGlobal && (
                <Badge variant="outline" className="text-[10px]">
                  Global
                </Badge>
              )}
              {!category.isActive && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Inactiva
                </Badge>
              )}
            </div>
          </>
        )}

        {!editing && (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* "+" siempre visible en categorías activas (globales también) */}
            {category.isActive && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title="Agregar subcategoría"
                onClick={() => setAddingChild(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Editar y toggle solo para categorías propias */}
            {!isGlobal && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  title="Renombrar"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={toggle.isPending}
                  onClick={() =>
                    toggle.mutate({ id: category.id, activate: !category.isActive })
                  }
                >
                  {category.isActive ? "Desactivar" : "Activar"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Subcategorías */}
      {category.children.length > 0 && (
        <div className="space-y-1 pt-1">
          {category.children.map((child) => (
            <ChildRow key={child.id} child={child} />
          ))}
        </div>
      )}

      <CreateCategoryDialog
        open={addingChild}
        onOpenChange={setAddingChild}
        parentCategory={category}
      />
    </div>
  );
}
