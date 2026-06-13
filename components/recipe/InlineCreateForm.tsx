"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  RecipeForm,
  initialValues,
  toRecipeInput,
  type RecipeFormValues,
} from "./RecipeForm";
import { createRecipeAction } from "@/app/actions/recipes";
import { uploadRecipeImageAction } from "@/app/actions/images";
import type { TagWithCount } from "@/types";

export function InlineCreateForm({
  availableTags,
}: {
  availableTags?: TagWithCount[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [values, setValues] = useState<RecipeFormValues>(() => initialValues());
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setValues(initialValues());
    setPendingFiles([]);
    setError(null);
    setExpanded(false);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createRecipeAction(toRecipeInput(values));
      if (!result.ok) {
        setError(result.error);
        return;
      }

      // 作成後に保留中の画像をアップロード
      for (const file of pendingFiles) {
        const fd = new FormData();
        fd.append("file", file);
        const up = await uploadRecipeImageAction(result.data.id, fd);
        if (!up.ok) {
          setError(`レシピは作成しましたが画像の追加に失敗しました: ${up.error}`);
          break;
        }
      }

      reset();
      router.refresh();
    });
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="mb-6 flex h-12 w-full max-w-xl items-center rounded-xl border border-border bg-surface px-4 text-sm text-muted shadow-sm transition-shadow hover:shadow-md"
      >
        レシピを追加...
      </button>
    );
  }

  return (
    <div className="mb-6 w-full max-w-xl">
      <RecipeForm
        values={values}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={reset}
        pending={pending}
        error={error}
        submitLabel="追加"
        autoFocus
        availableTags={availableTags}
        images={{
          recipeId: null,
          existing: [],
          onExistingChange: () => {},
          pendingFiles,
          onPendingFilesChange: setPendingFiles,
        }}
      />
    </div>
  );
}
