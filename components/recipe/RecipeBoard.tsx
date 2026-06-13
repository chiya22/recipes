"use client";

import { useState } from "react";
import { Masonry, MasonryItem } from "@/components/layout/Masonry";
import { InlineCreateForm } from "./InlineCreateForm";
import { RecipeCard } from "./RecipeCard";
import { RecipeModal } from "./RecipeModal";
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
  const [selected, setSelected] = useState<Recipe | null>(null);

  return (
    <div>
      <div className="flex justify-center">
        <InlineCreateForm availableTags={availableTags} />
      </div>

      {recipes.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted">
          {query
            ? `「${query}」に一致するレシピはありません。`
            : filtered
              ? "選択したタグをすべて持つレシピはありません。"
              : "レシピがまだありません。「レシピを追加...」から作成しましょう。"}
        </p>
      ) : (
        <Masonry>
          {recipes.map((recipe) => (
            <MasonryItem key={recipe.id}>
              <RecipeCard recipe={recipe} onOpen={setSelected} />
            </MasonryItem>
          ))}
        </Masonry>
      )}

      <RecipeModal
        recipe={selected}
        onClose={() => setSelected(null)}
        availableTags={availableTags}
      />
    </div>
  );
}
