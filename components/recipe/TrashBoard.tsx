"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Masonry, MasonryItem } from "@/components/layout/Masonry";
import { TagChips } from "./TagChips";
import {
  restoreRecipeAction,
  permanentDeleteRecipeAction,
} from "@/app/actions/recipes";
import type { Recipe } from "@/types";

export function TrashBoard({ recipes }: { recipes: Recipe[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleRestore(id: string) {
    startTransition(async () => {
      await restoreRecipeAction(id);
      router.refresh();
    });
  }

  function handlePermanentDelete(id: string) {
    if (!confirm("このレシピを完全に削除します。元に戻せません。よろしいですか？")) {
      return;
    }
    startTransition(async () => {
      await permanentDeleteRecipeAction(id);
      router.refresh();
    });
  }

  if (recipes.length === 0) {
    return (
      <p className="mt-12 text-center text-sm text-muted">ゴミ箱は空です。</p>
    );
  }

  return (
    <Masonry>
      {recipes.map((recipe) => (
          <MasonryItem key={recipe.id}>
            <article className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <h2 className="text-base font-medium text-foreground">
                {recipe.title}
              </h2>
              {recipe.ingredients && (
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-foreground/70">
                  {recipe.ingredients}
                </p>
              )}
              {recipe.tags.length > 0 && (
                <div className="mt-3">
                  <TagChips tags={recipe.tags} />
                </div>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRestore(recipe.id)}
                  disabled={pending}
                  className="h-9 rounded-lg bg-accent px-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                >
                  復元
                </button>
                <button
                  type="button"
                  onClick={() => handlePermanentDelete(recipe.id)}
                  disabled={pending}
                  className="h-9 rounded-lg px-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  完全に削除
                </button>
              </div>
            </article>
          </MasonryItem>
      ))}
    </Masonry>
  );
}
