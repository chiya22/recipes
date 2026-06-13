import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { RecipeBoard } from "@/components/recipe/RecipeBoard";
import { requireUser } from "@/lib/auth/dal";
import { listActiveRecipes } from "@/lib/recipes";
import { listTagsWithCount } from "@/lib/tags";

function parseTagIds(value: string | string[] | undefined): string[] {
  if (!value) return [];
  const raw = Array.isArray(value) ? value.join(",") : value;
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ tags?: string | string[]; q?: string | string[] }>;
}) {
  const { tags: tagsParam, q: qParam } = await searchParams;
  const selectedTagIds = parseTagIds(tagsParam);
  const query = (Array.isArray(qParam) ? qParam[0] : qParam)?.trim() ?? "";

  const [user, tags, recipes] = await Promise.all([
    requireUser(),
    listTagsWithCount(),
    listActiveRecipes({ tagIds: selectedTagIds, query }),
  ]);

  // 存在しないタグ ID は除外（壊れた URL 対策）
  const validTagIds = new Set(tags.map((t) => t.id));
  const selected = selectedTagIds.filter((id) => validTagIds.has(id));

  return (
    <div className="min-h-full">
      <AppHeader user={user} active="home" searchQuery={query} />
      <main className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        <Sidebar tags={tags} selected={selected} />
        <div className="min-w-0 flex-1">
          <MobileSidebar tags={tags} selected={selected} />
          <RecipeBoard
            recipes={recipes}
            availableTags={tags}
            filtered={selected.length > 0 || query.length > 0}
            query={query}
          />
        </div>
      </main>
    </div>
  );
}
