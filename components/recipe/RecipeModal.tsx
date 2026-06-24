"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import {
  RecipeForm,
  initialValues,
  isRecipeFormDirty,
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
  const [baseline, setBaseline] = useState<RecipeFormValues>(() =>
    initialValues(recipe ?? undefined),
  );
  const [editImages, setEditImages] = useState<RecipeImage[]>(
    recipe?.images ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [discardPrompt, setDiscardPrompt] = useState(false);
  const [pending, startTransition] = useTransition();

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const baselineRef = useRef(baseline);
  baselineRef.current = baseline;
  const discardPromptRef = useRef(discardPrompt);
  discardPromptRef.current = discardPrompt;

  useEffect(() => {
    if (!recipe) return;
    const initial = initialValues(recipe);
    setValues(initial);
    setBaseline(initial);
    setEditImages(recipe.images);
    setError(null);
    setDiscardPrompt(false);
  }, [recipe?.id]);

  const requestClose = useCallback(() => {
    if (discardPromptRef.current) {
      setDiscardPrompt(false);
      return;
    }
    if (isRecipeFormDirty(valuesRef.current, baselineRef.current)) {
      setDiscardPrompt(true);
      return;
    }
    onClose();
  }, [onClose]);

  const confirmDiscard = useCallback(() => {
    setDiscardPrompt(false);
    onClose();
  }, [onClose]);

  /** キャンセルボタンは意図的な操作のため、未保存でもそのまま閉じる */
  const handleCancel = useCallback(() => {
    setDiscardPrompt(false);
    onClose();
  }, [onClose]);

  if (!recipe) return null;

  const r = recipe;

  function handleSave() {
    setDiscardPrompt(false);
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
    <Modal open={!!recipe} onClose={requestClose} labelledBy="recipe-modal-title">
      <div className="p-4">
        <h2 id="recipe-modal-title" className="sr-only">
          {r.title} を編集
        </h2>

        {discardPrompt && (
          <div
            role="alertdialog"
            aria-labelledby="discard-dialog-title"
            className="mb-2 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <p id="discard-dialog-title" className="text-xs text-foreground">
              <span className="font-medium">変更が保存されていません。</span>
              <span className="text-muted"> 閉じると編集内容は失われます。</span>
            </p>
            <div className="flex shrink-0 justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setDiscardPrompt(false)}
                className="h-8 rounded-lg px-2.5 text-xs text-foreground hover:bg-black/5"
              >
                編集を続ける
              </button>
              <button
                type="button"
                onClick={confirmDiscard}
                className="h-8 rounded-lg bg-accent px-3 text-xs font-medium text-white hover:opacity-90"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        <RecipeForm
          values={values}
          onChange={setValues}
          onSubmit={handleSave}
          onCancel={handleCancel}
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
