"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import {
  createRecipe,
  updateRecipe,
  softDeleteRecipe,
  restoreRecipe,
  permanentDeleteRecipe,
  getRecipeById,
  type RecipeInput,
} from "@/lib/recipes";
import { notifyRecipeChange } from "@/lib/email/notifications";
import type { Recipe } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function validateInput(input: RecipeInput): string | null {
  if (!input.title || !input.title.trim()) {
    return "タイトルを入力してください";
  }
  if (input.title.trim().length > 200) {
    return "タイトルは 200 文字以内で入力してください";
  }
  return null;
}

export async function createRecipeAction(
  input: RecipeInput,
): Promise<ActionResult<Recipe>> {
  const user = await requireUser();
  const validationError = validateInput(input);
  if (validationError) return { ok: false, error: validationError };

  try {
    const recipe = await createRecipe(input, user.id);
    revalidatePath("/");
    await notifyRecipeChange({ action: "created", recipe, actor: user });
    return { ok: true, data: recipe };
  } catch {
    return { ok: false, error: "レシピの作成に失敗しました" };
  }
}

export async function updateRecipeAction(
  id: string,
  input: RecipeInput,
): Promise<ActionResult<Recipe>> {
  const user = await requireUser();
  const validationError = validateInput(input);
  if (validationError) return { ok: false, error: validationError };

  try {
    const recipe = await updateRecipe(id, input, user.id);
    revalidatePath("/");
    await notifyRecipeChange({ action: "updated", recipe, actor: user });
    return { ok: true, data: recipe };
  } catch {
    return { ok: false, error: "レシピの更新に失敗しました" };
  }
}

export async function deleteRecipeAction(
  id: string,
): Promise<ActionResult> {
  const user = await requireUser();
  try {
    const recipe = await getRecipeById(id);
    await softDeleteRecipe(id);
    revalidatePath("/");
    revalidatePath("/trash");
    if (recipe) {
      await notifyRecipeChange({ action: "deleted", recipe, actor: user });
    }
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "レシピの削除に失敗しました" };
  }
}

export async function restoreRecipeAction(
  id: string,
): Promise<ActionResult> {
  await requireUser();
  try {
    await restoreRecipe(id);
    revalidatePath("/");
    revalidatePath("/trash");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "レシピの復元に失敗しました" };
  }
}

export async function permanentDeleteRecipeAction(
  id: string,
): Promise<ActionResult> {
  await requireUser();
  try {
    await permanentDeleteRecipe(id);
    revalidatePath("/trash");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "レシピの完全削除に失敗しました" };
  }
}
