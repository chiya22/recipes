import type { RecipeImage } from "@/types";

export type RecipePrintContent = {
  title: string;
  ingredients: string;
  instructions: string;
  notes: string;
  tagNames: string[];
  images: RecipeImage[];
};

function PrintSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6 break-inside-avoid last:mb-0">
      <h2 className="mb-2 border-b border-border pb-1 text-base font-semibold text-foreground">
        {title}
      </h2>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {children}
      </div>
    </section>
  );
}

/** 印刷向けにレイアウトしたレシピ表示。 */
export function RecipePrintView({
  title,
  ingredients,
  instructions,
  notes,
  tagNames,
  images,
}: RecipePrintContent) {
  const visibleImages = images.filter((img) => img.url);

  return (
    <article className="recipe-print-content text-foreground">
      <header className="mb-6 border-b-2 border-foreground pb-3">
        <h1 className="text-2xl font-bold leading-tight">{title || "（無題）"}</h1>
        {tagNames.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            タグ: {tagNames.join("、")}
          </p>
        )}
      </header>

      {visibleImages.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-3 break-inside-avoid sm:grid-cols-3">
          {visibleImages.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={img.url}
              alt=""
              className="aspect-[4/3] w-full rounded-lg border border-border object-cover print:rounded-none print:border-black/20"
            />
          ))}
        </div>
      )}

      {ingredients.trim() && (
        <PrintSection title="材料">{ingredients}</PrintSection>
      )}

      {instructions.trim() && (
        <PrintSection title="作り方">{instructions}</PrintSection>
      )}

      {notes.trim() && <PrintSection title="その他">{notes}</PrintSection>}
    </article>
  );
}
