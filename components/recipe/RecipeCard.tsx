"use client";

import Image from "next/image";
import { TagChips } from "./TagChips";
import type { Recipe } from "@/types";

type RecipeCardProps = {
  recipe: Recipe;
  onOpen: (recipe: Recipe) => void;
};

export function RecipeCard({ recipe, onOpen }: RecipeCardProps) {
  const thumbnails = recipe.images.slice(0, 3);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => onOpen(recipe)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(recipe);
        }
      }}
      className="cursor-pointer rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      {thumbnails.length > 0 && (
        <div className="mb-3 flex gap-1 overflow-hidden rounded-lg">
          {thumbnails.map((img) => (
            <div key={img.id} className="relative h-20 flex-1">
              {img.url && (
                <Image
                  src={img.url}
                  alt={recipe.title}
                  fill
                  sizes="200px"
                  className="object-cover"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <h2 className="text-base font-medium text-foreground">{recipe.title}</h2>

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
    </article>
  );
}
