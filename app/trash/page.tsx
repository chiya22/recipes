import { AppHeader } from "@/components/layout/AppHeader";
import { TrashBoard } from "@/components/recipe/TrashBoard";
import { requireUser } from "@/lib/auth/dal";
import { listDeletedRecipes } from "@/lib/recipes";

export default async function TrashPage() {
  const user = await requireUser();
  const recipes = await listDeletedRecipes();

  return (
    <div className="min-h-full">
      <AppHeader user={user} active="trash" />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <h1 className="mb-4 text-lg font-medium text-foreground">ゴミ箱</h1>
        <TrashBoard recipes={recipes} />
      </main>
    </div>
  );
}
