"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/layout/SearchBar";
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
  searchQuery = "",
}: {
  availableTags?: TagWithCount[];
  searchQuery?: string;
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

  if (expanded) {
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

  return (
    <div className="mb-6 flex w-full max-w-xl items-center gap-2">
      <SearchBar initialQuery={searchQuery} className="min-w-0 flex-1" />
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="h-10 shrink-0 cursor-pointer rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
      >
        +新規作成
      </button>
    </div>
  );
}
