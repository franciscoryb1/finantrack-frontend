"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CategoryForm } from "./CategoryForm";
import { useCreateCategory } from "../hooks/useCreateCategory";
import { CategoryFormValues } from "../schemas/category.schema";
import { Category, CategoryChild, CategoryType } from "../api/categories.api";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Si se pasa, crea subcategoría de esta categoría padre */
  parentCategory?: Category | CategoryChild;
  /** Tipo pre-seleccionado al crear categoría raíz */
  defaultType?: CategoryType;
};

export function CreateCategoryDialog({
  open,
  onOpenChange,
  parentCategory,
  defaultType,
}: Props) {
  const createCategory = useCreateCategory();

  async function handleSubmit(values: CategoryFormValues) {
    await createCategory.mutateAsync({
      name: values.name,
      type: parentCategory ? undefined : values.type,
      parentId: parentCategory ? parentCategory.id : undefined,
      color: values.color ?? undefined,
    });
    onOpenChange(false);
  }

  const title = parentCategory
    ? `Nueva subcategoría de "${parentCategory.name}"`
    : "Nueva categoría";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <CategoryForm
          onSubmit={handleSubmit}
          submitLabel="Crear"
          parentType={parentCategory?.type}
          defaultValues={!parentCategory && defaultType ? { type: defaultType } : undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
