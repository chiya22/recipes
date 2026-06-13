"use client";

import { TagPicker } from "./TagPicker";
import { ImageUploader } from "./ImageUploader";
import type { Recipe, RecipeImage, TagWithCount } from "@/types";
import type { RecipeInput } from "@/lib/recipes";

export type RecipeFormValues = {
  title: string;
  ingredients: string;
  instructions: string;
  notes: string;
  tagNames: string[];
};

export function initialValues(recipe?: Recipe): RecipeFormValues {
  return {
    title: recipe?.title ?? "",
    ingredients: recipe?.ingredients ?? "",
    instructions: recipe?.instructions ?? "",
    notes: recipe?.notes ?? "",
    tagNames: recipe?.tags.map((t) => t.name) ?? [],
  };
}

type RecipeFormProps = {
  values: RecipeFormValues;
  onChange: (values: RecipeFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  pending?: boolean;
  error?: string | null;
  submitLabel?: string;
  autoFocus?: boolean;
  availableTags?: TagWithCount[];
  /** 画像管理（任意）。指定時のみ画像セクションを表示。 */
  images?: {
    recipeId?: string | null;
    existing: RecipeImage[];
    onExistingChange: (images: RecipeImage[]) => void;
    pendingFiles: File[];
    onPendingFilesChange: (files: File[]) => void;
  };
};

export function toRecipeInput(v: RecipeFormValues): RecipeInput {
  return {
    title: v.title,
    ingredients: v.ingredients,
    instructions: v.instructions,
    notes: v.notes,
    tagNames: v.tagNames,
  };
}

const fieldClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:bg-background-focus";

export function RecipeForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  pending,
  error,
  submitLabel = "保存",
  autoFocus,
  availableTags,
  images,
}: RecipeFormProps) {
  function set<K extends keyof RecipeFormValues>(key: K, val: RecipeFormValues[K]) {
    onChange({ ...values, [key]: val });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-3"
    >
      <input
        type="text"
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="タイトル"
        autoFocus={autoFocus}
        className={`${fieldClass} font-medium`}
        maxLength={200}
      />
      <textarea
        value={values.ingredients}
        onChange={(e) => set("ingredients", e.target.value)}
        placeholder="材料"
        rows={3}
        className={`${fieldClass} resize-y`}
      />
      <textarea
        value={values.instructions}
        onChange={(e) => set("instructions", e.target.value)}
        placeholder="作り方"
        rows={4}
        className={`${fieldClass} resize-y`}
      />
      <textarea
        value={values.notes}
        onChange={(e) => set("notes", e.target.value)}
        placeholder="その他（メモ）"
        rows={2}
        className={`${fieldClass} resize-y`}
      />

      <TagPicker
        value={values.tagNames}
        onChange={(t) => set("tagNames", t)}
        availableTags={availableTags}
      />

      {images && (
        <ImageUploader
          recipeId={images.recipeId}
          images={images.existing}
          onImagesChange={images.onExistingChange}
          pendingFiles={images.pendingFiles}
          onPendingFilesChange={images.onPendingFilesChange}
        />
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="h-9 rounded-lg px-3 text-sm text-muted hover:bg-black/5 disabled:opacity-60"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "保存中..." : submitLabel}
        </button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </form>
  );
}
