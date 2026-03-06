"use client";

import { useState } from "react";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { CategoryItem } from "@/features/categories/components/CategoryItem";
import { CreateCategoryDialog } from "@/features/categories/components/CreateCategoryDialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CategoryType } from "@/features/categories/api/categories.api";

type Tab = CategoryType;

export default function CategoriesPage() {
  const [tab, setTab] = useState<Tab>("EXPENSE");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [creating, setCreating] = useState(false);

  const { data: categories = [], isLoading } = useCategories(tab, includeInactive);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Categorías</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nueva categoría
        </Button>
      </div>

      {/* Tabs + toggle inactivas */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                tab === t
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "EXPENSE" ? "Gastos" : "Ingresos"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Switch
            id="show-inactive"
            checked={includeInactive}
            onCheckedChange={setIncludeInactive}
          />
          <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
            Mostrar inactivas
          </Label>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm">Cargando...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No hay categorías de {tab === "EXPENSE" ? "gastos" : "ingresos"}.
        </p>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <CategoryItem key={cat.id} category={cat} />
          ))}
        </div>
      )}

      <CreateCategoryDialog
        open={creating}
        onOpenChange={setCreating}
        defaultType={tab}
      />
    </div>
  );
}
