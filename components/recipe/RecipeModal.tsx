"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import {
  RecipeForm,
  initialValues,
  toRecipeInput,
  type RecipeFormValues,
} from "./RecipeForm";
import { updateRecipeAction, deleteRecipeAction } from "@/app/actions/recipes";
import type { Recipe, RecipeImage, TagWithCount } from "@/types";

type RecipeModalProps = {
  recipe: Recipe | null;
  onClose: () => void;
  availableTags?: TagWithCount[];
};

export function RecipeModal({
  recipe,
  onClose,
  availableTags,
}: RecipeModalProps) {
  const router = useRouter();
  const [values, setValues] = useState<RecipeFormValues>(() =>
    initialValues(recipe ?? undefined),
  );
  const [editImages, setEditImages] = useState<RecipeImage[]>(
    recipe?.images ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [trackedId, setTrackedId] = useState(recipe?.id);
  if (recipe && recipe.id !== trackedId) {
    setTrackedId(recipe.id);
    setValues(initialValues(recipe));
    setEditImages(recipe.images);
    setError(null);
  }

  if (!recipe) return null;

  const r = recipe;

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateRecipeAction(r.id, toRecipeInput(values));
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm("このレシピをゴミ箱に移動しますか？")) return;
    startTransition(async () => {
      const result = await deleteRecipeAction(r.id);
      if (result.ok) {
        router.refresh();
        onClose();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Modal open={!!recipe} onClose={onClose} labelledBy="recipe-modal-title">
      <div className="p-4">
        <h2 id="recipe-modal-title" className="sr-only">
          {r.title} を編集
        </h2>
        <RecipeForm
          values={values}
          onChange={setValues}
          onSubmit={handleSave}
          onCancel={onClose}
          pending={pending}
          error={error}
          submitLabel="保存"
          availableTags={availableTags}
          images={{
            recipeId: r.id,
            existing: editImages,
            onExistingChange: setEditImages,
            pendingFiles: [],
            onPendingFilesChange: () => {},
          }}
        />
        <div className="mt-2 flex justify-start">
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="h-9 rounded-lg px-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            ゴミ箱に移動
          </button>
        </div>
      </div>
    </Modal>
  );
}
