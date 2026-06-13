"use client";

import Image from "next/image";
import { TagChips } from "./TagChips";
import type { Recipe } from "@/types";

type RecipeCardProps = {
  recipe: Recipe;
  onOpen: (recipe: Recipe) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: (recipe: Recipe) => void;
};

export function RecipeCard({
  recipe,
  onOpen,
  selectable = false,
  selected = false,
  onSelectToggle,
}: RecipeCardProps) {
  const thumbnails = recipe.images.slice(0, 3);

  function handleActivate() {
    if (selectable) {
      onSelectToggle?.(recipe);
      return;
    }
    onOpen(recipe);
  }

  return (
    <article
      role={selectable ? undefined : "button"}
      tabIndex={selectable ? undefined : 0}
      onClick={handleActivate}
      onKeyDown={
        selectable
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen(recipe);
              }
            }
      }
      className={[
        "relative rounded-xl border bg-surface p-4 shadow-sm transition-shadow",
        selectable ? "cursor-pointer" : "cursor-pointer hover:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        selected ? "border-accent ring-2 ring-accent/20" : "border-border",
      ].join(" ")}
    >
      {selectable && (
        <div className="absolute left-3 top-3 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onSelectToggle?.(recipe)}
            onClick={(e) => e.stopPropagation()}
            aria-label={`${recipe.title} を選択`}
            className="h-4 w-4 cursor-pointer accent-accent"
          />
        </div>
      )}

      {thumbnails.length > 0 && (
        <div className={`mb-3 flex gap-1 overflow-hidden rounded-lg ${selectable ? "mt-6" : ""}`}>
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

      <h2 className={`text-base font-medium text-foreground ${selectable && thumbnails.length === 0 ? "mt-6" : ""}`}>
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
    </article>
  );
}
