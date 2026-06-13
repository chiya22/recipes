"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import {
  addRecipeImage,
  deleteRecipeImage,
  ImageError,
} from "@/lib/recipes";
import type { RecipeImage } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function uploadRecipeImageAction(
  recipeId: string,
  formData: FormData,
): Promise<ActionResult<RecipeImage>> {
  await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "画像ファイルを選択してください" };
  }
  if (!recipeId) {
    return { ok: false, error: "レシピが指定されていません" };
  }

  try {
    const image = await addRecipeImage(recipeId, file);
    revalidatePath("/");
    return { ok: true, data: image };
  } catch (err) {
    if (err instanceof ImageError) return { ok: false, error: err.message };
    return { ok: false, error: "画像のアップロードに失敗しました" };
  }
}

export async function deleteRecipeImageAction(
  imageId: string,
): Promise<ActionResult> {
  await requireUser();

  try {
    await deleteRecipeImage(imageId);
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch (err) {
    if (err instanceof ImageError) return { ok: false, error: err.message };
    return { ok: false, error: "画像の削除に失敗しました" };
  }
}
