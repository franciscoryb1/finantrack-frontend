"use client";

import { useState } from "react";
import { Category, CategoryChild } from "../api/categories.api";
import { useToggleCategory } from "../hooks/useToggleCategory";
import { useUpdateCategory } from "../hooks/useUpdateCategory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateCategoryDialog } from "./CreateCategoryDialog";
import { ColorPicker } from "./ColorPicker";

// ── Dot de color ──────────────────────────────────────────────────────────────

function ColorDot({ color }: { color: string | null }) {
  if (!color) return null;
  return (
    <span
      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
      style={{ backgroundColor: color }}
    />
  );
}

// ── Editor de nombre inline ───────────────────────────────────────────────────

type InlineEditProps = {
  value: string;
  color: string | null;
  onSave: (name: string, color: string | null) => Promise<void>;
  onCancel: () => void;
};

function InlineEdit({ value, color, onSave, onCancel }: InlineEditProps) {
  const [name, setName] = useState(value);
  const [currentColor, setCurrentColor] = useState<string | null>(color);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const trimmed = name.trim();
    if (trimmed.length < 2) return;
    setSaving(true);
    await onSave(trimmed, currentColor);
    setSaving(false);
  }

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0">
      <ColorPicker value={currentColor} onChange={setCurrentColor} />
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

// ── Confirmación de desactivar ────────────────────────────────────────────────

type DeactivateDialogProps = {
  name: string;
  hasChildren: boolean;
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function DeactivateDialog({ name, hasChildren, open, onConfirm, onCancel }: DeactivateDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Desactivar "{name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            La categoría quedará inactiva y no podrá usarse en nuevos movimientos.
            {hasChildren && (
              <span className="block mt-1 font-medium text-foreground">
                Todas sus subcategorías también serán desactivadas.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Desactivar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Fila de subcategoría ──────────────────────────────────────────────────────

function ChildRow({ child }: { child: CategoryChild }) {
  const [editing, setEditing] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const toggle = useToggleCategory();
  const update = useUpdateCategory();
  const isGlobal = child.userId === null;

  async function handleSave(name: string, color: string | null) {
    await update.mutateAsync({ id: child.id, data: { name, color: color ?? undefined } });
    setEditing(false);
  }

  function handleToggleClick() {
    if (child.isActive) {
      setConfirmDeactivate(true);
    } else {
      toggle.mutate({ id: child.id, activate: true });
    }
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 py-2 px-3 rounded-md ml-6 border-l-2",
          !child.isActive && "opacity-50"
        )}
        style={child.color ? { borderLeftColor: child.color } : undefined}
      >
        {editing ? (
          <InlineEdit
            value={child.name}
            color={child.color}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <ColorDot color={child.color} />
            <span className="text-sm flex-1 min-w-0 truncate">{child.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              {isGlobal && (
                <Badge variant="outline" className="text-[10px]">Global</Badge>
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
              onClick={handleToggleClick}
            >
              {child.isActive ? "Desactivar" : "Activar"}
            </Button>
          </div>
        )}
      </div>

      <DeactivateDialog
        name={child.name}
        hasChildren={false}
        open={confirmDeactivate}
        onConfirm={() => {
          setConfirmDeactivate(false);
          toggle.mutate({ id: child.id, activate: false });
        }}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </>
  );
}

// ── Categoría padre ───────────────────────────────────────────────────────────

type Props = {
  category: Category;
};

export function CategoryItem({ category }: Props) {
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const toggle = useToggleCategory();
  const update = useUpdateCategory();
  const isGlobal = category.userId === null;
  const hasChildren = category.children.length > 0;

  async function handleSave(name: string, color: string | null) {
    await update.mutateAsync({ id: category.id, data: { name, color: color ?? undefined } });
    setEditing(false);
  }

  function handleToggleClick() {
    if (category.isActive) {
      setConfirmDeactivate(true);
    } else {
      toggle.mutate({ id: category.id, activate: true });
    }
  }

  return (
    <>
      <div
        className={cn(
          "border rounded-lg p-3 space-y-1 bg-card",
          category.color && "border-l-4",
          !category.isActive && "opacity-60"
        )}
        style={category.color ? { borderLeftColor: category.color } : undefined}
      >
        {/* Fila padre */}
        <div className="flex items-center gap-2 min-h-[2rem]">
          {/* Chevron desplegable */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            disabled={!hasChildren}
            onClick={() => setOpen((o) => !o)}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform text-muted-foreground",
                open && "rotate-180",
                !hasChildren && "opacity-20"
              )}
            />
          </Button>

          {editing ? (
            <InlineEdit
              value={category.name}
              color={category.color}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <ColorDot color={category.color} />
              <button
                className="font-semibold flex-1 min-w-0 truncate text-left"
                onClick={() => hasChildren && setOpen((o) => !o)}
              >
                {category.name}
              </button>
              <div className="flex items-center gap-1 shrink-0">
                {isGlobal && (
                  <Badge variant="outline" className="text-[10px]">Global</Badge>
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
                    onClick={handleToggleClick}
                  >
                    {category.isActive ? "Desactivar" : "Activar"}
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Subcategorías */}
        {hasChildren && open && (
          <div className="space-y-1 pt-1">
            {category.children.map((child) => (
              <ChildRow key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>

      <CreateCategoryDialog
        open={addingChild}
        onOpenChange={setAddingChild}
        parentCategory={category}
      />

      <DeactivateDialog
        name={category.name}
        hasChildren={hasChildren}
        open={confirmDeactivate}
        onConfirm={() => {
          setConfirmDeactivate(false);
          toggle.mutate({ id: category.id, activate: false });
        }}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </>
  );
}
