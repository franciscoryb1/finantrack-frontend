import { Badge } from "@/components/ui/badge";

type CategoryLike = {
  name: string;
  color?: string | null;
  parent?: { name: string; color?: string | null } | null;
};

/** Resuelve el color efectivo: usa el color propio, o el del padre como fallback. */
export function resolveCategoryColor(category: CategoryLike): string | null {
  return category.color ?? category.parent?.color ?? null;
}

type Props = {
  category: CategoryLike;
  className?: string;
};

/**
 * Badge de categoría con color resuelto.
 * Muestra "Padre › Hijo" si tiene padre, o solo el nombre si es raíz.
 */
export function CategoryBadge({ category, className }: Props) {
  const color = resolveCategoryColor(category);
  const label = category.parent
    ? `${category.parent.name} › ${category.name}`
    : category.name;

  return (
    <Badge
      variant="outline"
      className={className}
      style={
        color
          ? {
              backgroundColor: `${color}20`,
              color,
              borderColor: `${color}50`,
            }
          : undefined
      }
    >
      {label}
    </Badge>
  );
}
