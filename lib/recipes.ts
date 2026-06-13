import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { recipeIdsWithAllTags } from "@/lib/tags";
import { toGroongaQuery } from "@/lib/search";
import {
  IMAGE_ALLOWED_TYPES,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_COUNT,
} from "@/lib/image-constants";
import type { Recipe, RecipeImage, Tag } from "@/types";
import type { TablesInsert } from "@/types/database";

const STORAGE_BUCKET = "recipe-images";
const SIGNED_URL_TTL = 60 * 60; // 1時間

export type RecipeInput = {
  title: string;
  ingredients?: string;
  instructions?: string;
  notes?: string;
  tagNames?: string[];
};

// Supabase のネストした select 結果の型
type RecipeRow = {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  notes: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: { id: string; name: string } | null;
  updated_by: { id: string; name: string } | null;
  recipe_tags: { tags: { id: string; name: string } | null }[];
  recipe_images: { id: string; storage_path: string; sort_order: number }[];
};

const RECIPE_SELECT = `
  id, title, ingredients, instructions, notes,
  created_at, updated_at, deleted_at,
  created_by:users!recipes_created_by_fkey ( id, name ),
  updated_by:users!recipes_updated_by_fkey ( id, name ),
  recipe_tags ( tags ( id, name ) ),
  recipe_images ( id, storage_path, sort_order )
`;

function mapTags(row: RecipeRow): Tag[] {
  return row.recipe_tags
    .map((rt) => rt.tags)
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .map((t) => ({ id: t.id, name: t.name }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

async function mapRecipes(rows: RecipeRow[]): Promise<Recipe[]> {
  const supabase = createServerSupabaseClient();

  // 画像の署名付き URL をまとめて生成
  const allPaths = rows.flatMap((r) =>
    r.recipe_images.map((img) => img.storage_path),
  );
  const urlByPath = new Map<string, string>();
  if (allPaths.length > 0) {
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrls(allPaths, SIGNED_URL_TTL);
    for (const item of data ?? []) {
      if (item.path && item.signedUrl) urlByPath.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => {
    const images: RecipeImage[] = row.recipe_images
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((img) => ({
        id: img.id,
        storagePath: img.storage_path,
        url: urlByPath.get(img.storage_path) ?? "",
        sortOrder: img.sort_order,
      }));

    return {
      id: row.id,
      title: row.title,
      ingredients: row.ingredients,
      instructions: row.instructions,
      notes: row.notes,
      tags: mapTags(row),
      images,
      createdBy: row.created_by ?? { id: "", name: "(不明)" },
      updatedBy: row.updated_by ?? { id: "", name: "(不明)" },
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  });
}

/** 全文検索にマッチするレシピ ID を返す（PGroonga RPC 経由）。 */
async function searchRecipeIds(query: string): Promise<string[]> {
  const groonga = toGroongaQuery(query);
  if (!groonga) return [];
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.rpc("search_recipe_ids", {
    q: groonga,
  });
  if (error) throw error;
  return (data ?? []).map(String);
}

/** 2 つの ID 集合の積（交差）。 */
function intersectIds(a: string[], b: string[]): string[] {
  const set = new Set(a);
  return b.filter((id) => set.has(id));
}

export async function listActiveRecipes(options?: {
  tagIds?: string[];
  query?: string;
}): Promise<Recipe[]> {
  const supabase = createServerSupabaseClient();

  const hasTagFilter = !!options?.tagIds && options.tagIds.length > 0;
  const hasQuery = !!options?.query && options.query.trim().length > 0;

  // タグ AND 絞り込みと全文検索を ID 集合の交差で組み合わせる
  let filterIds: string[] | null = null;

  if (hasTagFilter) {
    const tagIds = await recipeIdsWithAllTags(options!.tagIds!);
    filterIds = tagIds ?? [];
  }

  if (hasQuery) {
    const searchIds = await searchRecipeIds(options!.query!);
    filterIds = filterIds === null ? searchIds : intersectIds(filterIds, searchIds);
  }

  if (filterIds !== null && filterIds.length === 0) return [];

  let query = supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .is("deleted_at", null);

  if (filterIds !== null) {
    query = query.in("id", filterIds);
  }

  const { data, error } = await query.order("title", { ascending: true });
  if (error) throw error;
  return mapRecipes((data ?? []) as unknown as RecipeRow[]);
}

export async function listDeletedRecipes(): Promise<Recipe[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) throw error;
  return mapRecipes((data ?? []) as unknown as RecipeRow[]);
}

export async function getRecipeById(id: string): Promise<Recipe | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const [recipe] = await mapRecipes([data as unknown as RecipeRow]);
  return recipe ?? null;
}

/** タグ名の配列を正規化（trim・空除去・重複除去） */
function cleanTagNames(tagNames: string[] | undefined): string[] {
  if (!tagNames) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of tagNames) {
    const name = raw.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      result.push(name);
    }
  }
  return result;
}

/** レシピのタグを指定の名前リストと一致させる（タグは無ければ作成）。 */
async function syncRecipeTags(
  recipeId: string,
  tagNames: string[],
): Promise<void> {
  const supabase = createServerSupabaseClient();
  const names = cleanTagNames(tagNames);

  if (names.length === 0) {
    await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);
    return;
  }

  // タグを upsert（存在すれば無視）
  const tagInserts: TablesInsert<"tags">[] = names.map((name) => ({ name }));
  await supabase
    .from("tags")
    .upsert(tagInserts, { onConflict: "name", ignoreDuplicates: true });

  const { data: tagRows, error: tagErr } = await supabase
    .from("tags")
    .select("id, name")
    .in("name", names);
  if (tagErr) throw tagErr;

  const tagIds = (tagRows ?? []).map((t) => t.id);

  // 既存のリンクを置き換え
  await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);
  if (tagIds.length > 0) {
    const links: TablesInsert<"recipe_tags">[] = tagIds.map((tagId) => ({
      recipe_id: recipeId,
      tag_id: tagId,
    }));
    const { error: linkErr } = await supabase.from("recipe_tags").insert(links);
    if (linkErr) throw linkErr;
  }
}

export async function createRecipe(
  input: RecipeInput,
  userId: string,
): Promise<Recipe> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: input.title.trim(),
      ingredients: input.ingredients?.trim() ?? "",
      instructions: input.instructions?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error) throw error;

  await syncRecipeTags(data.id, input.tagNames ?? []);
  const recipe = await getRecipeById(data.id);
  if (!recipe) throw new Error("作成したレシピの取得に失敗しました");
  return recipe;
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
  userId: string,
): Promise<Recipe> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("recipes")
    .update({
      title: input.title.trim(),
      ingredients: input.ingredients?.trim() ?? "",
      instructions: input.instructions?.trim() ?? "",
      notes: input.notes?.trim() ?? "",
      updated_by: userId,
    })
    .eq("id", id);

  if (error) throw error;

  await syncRecipeTags(id, input.tagNames ?? []);
  const recipe = await getRecipeById(id);
  if (!recipe) throw new Error("更新したレシピの取得に失敗しました");
  return recipe;
}

export async function softDeleteRecipe(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("recipes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function restoreRecipe(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("recipes")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) throw error;
}

/** エラーメッセージ付きの検証例外。 */
export class ImageError extends Error {}

/** レシピに画像を 1 枚追加する。Storage へアップロードし recipe_images に登録。 */
export async function addRecipeImage(
  recipeId: string,
  file: File,
): Promise<RecipeImage> {
  const ext = IMAGE_ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new ImageError("対応形式は JPEG / PNG / WebP です");
  }
  if (file.size > IMAGE_MAX_BYTES) {
    throw new ImageError("画像サイズは 5MB 以内にしてください");
  }

  const supabase = createServerSupabaseClient();

  // レシピの存在確認 + 枚数上限チェック
  const { data: existing, error: countErr } = await supabase
    .from("recipe_images")
    .select("sort_order")
    .eq("recipe_id", recipeId);
  if (countErr) throw countErr;
  if ((existing?.length ?? 0) >= IMAGE_MAX_COUNT) {
    throw new ImageError(`画像は 1 レシピ ${IMAGE_MAX_COUNT} 枚までです`);
  }
  const nextSortOrder =
    (existing ?? []).reduce((max, r) => Math.max(max, r.sort_order), -1) + 1;

  const imageId = crypto.randomUUID();
  const storagePath = `${recipeId}/${imageId}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });
  if (uploadErr) throw uploadErr;

  const { error: insertErr } = await supabase.from("recipe_images").insert({
    id: imageId,
    recipe_id: recipeId,
    storage_path: storagePath,
    sort_order: nextSortOrder,
  });
  if (insertErr) {
    // 後始末: DB 失敗時は Storage の孤児ファイルを削除
    await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
    throw insertErr;
  }

  const { data: signed } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);

  return {
    id: imageId,
    storagePath,
    url: signed?.signedUrl ?? "",
    sortOrder: nextSortOrder,
  };
}

/** 画像を 1 枚削除する（Storage + DB）。所属レシピ ID を返す。 */
export async function deleteRecipeImage(imageId: string): Promise<string> {
  const supabase = createServerSupabaseClient();
  const { data: image, error } = await supabase
    .from("recipe_images")
    .select("storage_path, recipe_id")
    .eq("id", imageId)
    .maybeSingle();
  if (error) throw error;
  if (!image) throw new ImageError("画像が見つかりません");

  await supabase.storage.from(STORAGE_BUCKET).remove([image.storage_path]);

  const { error: delErr } = await supabase
    .from("recipe_images")
    .delete()
    .eq("id", imageId);
  if (delErr) throw delErr;

  return image.recipe_id;
}

export async function permanentDeleteRecipe(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  // Storage の画像も削除（DB は ON DELETE CASCADE）
  const { data: images } = await supabase
    .from("recipe_images")
    .select("storage_path")
    .eq("recipe_id", id);
  const paths = (images ?? []).map((i) => i.storage_path);
  if (paths.length > 0) {
    await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  }

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}
