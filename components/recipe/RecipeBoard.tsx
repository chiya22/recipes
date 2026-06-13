"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Masonry, MasonryItem } from "@/components/layout/Masonry";
import { InlineCreateForm } from "./InlineCreateForm";
import { RecipeCard } from "./RecipeCard";
import { RecipeModal } from "./RecipeModal";
import { bulkDeleteRecipesAction } from "@/app/actions/recipes";
import { Spinner } from "@/components/ui/Spinner";
import type { Recipe, TagWithCount } from "@/types";

export function RecipeBoard({
  recipes,
  availableTags,
  filtered = false,
  query = "",
}: {
  recipes: Recipe[];
  availableTags?: TagWithCount[];
  filtered?: boolean;
  query?: string;
}) {
  const router = useRouter();
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
    setError(null);
  }

  function toggleSelection(recipe: Recipe) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(recipe.id)) next.delete(recipe.id);
      else next.add(recipe.id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(recipes.map((r) => r.id)));
  }

  function handleBulkDelete() {
    const count = selectedIds.size;
    if (count === 0) return;
    if (!confirm(`選択した ${count} 件のレシピをゴミ箱に移動しますか？`)) return;

    setError(null);
    startTransition(async () => {
      const result = await bulkDeleteRecipesAction([...selectedIds]);
      if (result.ok) {
        exitSelectionMode();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="flex justify-center">
        <InlineCreateForm availableTags={availableTags} searchQuery={query} />
      </div>

      {recipes.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          {!selectionMode ? (
            <button
              type="button"
              onClick={() => {
                setDetailRecipe(null);
                setSelectionMode(true);
              }}
              className="h-9 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-background"
            >
              選択
            </button>
          ) : (
            <>
              <span className="text-sm text-muted">
                {selectedIds.size} 件選択中
              </span>
              <button
                type="button"
                onClick={selectAll}
                disabled={pending || selectedIds.size === recipes.length}
                className="h-9 rounded-lg border border-border px-3 text-sm text-foreground transition-colors hover:bg-background disabled:opacity-60"
              >
                すべて選択
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={pending || selectedIds.size === 0}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
              >
                {pending && <Spinner className="h-4 w-4" label="削除中" />}
                ゴミ箱に移動
              </button>
              <button
                type="button"
                onClick={exitSelectionMode}
                disabled={pending}
                className="h-9 rounded-lg border border-border px-3 text-sm text-muted transition-colors hover:bg-background disabled:opacity-60"
              >
                キャンセル
              </button>
            </>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 text-center text-sm text-red-600">
          {error}
        </p>
      )}

      {recipes.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted">
          {query
            ? `「${query}」に一致するレシピはありません。`
            : filtered
              ? "選択したタグをすべて持つレシピはありません。"
              : "レシピがまだありません。「レシピ追加」から作成しましょう。"}
        </p>
      ) : (
        <Masonry>
          {recipes.map((recipe) => (
            <MasonryItem key={recipe.id}>
              <RecipeCard
                recipe={recipe}
                onOpen={setDetailRecipe}
                selectable={selectionMode}
                selected={selectedIds.has(recipe.id)}
                onSelectToggle={toggleSelection}
              />
            </MasonryItem>
          ))}
        </Masonry>
      )}

      <RecipeModal
        recipe={detailRecipe}
        onClose={() => setDetailRecipe(null)}
        availableTags={availableTags}
      />
    </div>
  );
}
