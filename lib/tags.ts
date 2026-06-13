import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Tag, TagWithCount } from "@/types";

/** タグ一覧を使用回数付きで返す（名前の昇順）。 */
export async function listTagsWithCount(): Promise<TagWithCount[]> {
  const supabase = createServerSupabaseClient();

  const { data: tags, error } = await supabase
    .from("tags")
    .select("id, name");
  if (error) throw error;

  const { data: links, error: linkErr } = await supabase
    .from("recipe_tags")
    .select("tag_id");
  if (linkErr) throw linkErr;

  const countByTag = new Map<string, number>();
  for (const link of links ?? []) {
    countByTag.set(link.tag_id, (countByTag.get(link.tag_id) ?? 0) + 1);
  }

  return (tags ?? [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      count: countByTag.get(t.id) ?? 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));
}

/** タグ名の一覧（候補サジェスト用）。 */
export async function listTagNames(): Promise<string[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("tags")
    .select("name")
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((t) => t.name);
}

export type TagUpdate = { name?: string };

export async function updateTag(id: string, input: TagUpdate): Promise<Tag> {
  const supabase = createServerSupabaseClient();
  const patch: { name?: string } = {};
  if (typeof input.name === "string") patch.name = input.name.trim();

  const { data, error } = await supabase
    .from("tags")
    .update(patch)
    .eq("id", id)
    .select("id, name")
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name };
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  // recipe_tags は ON DELETE CASCADE で自動削除
  const { error } = await supabase.from("tags").delete().eq("id", id);
  if (error) throw error;
}

/** sourceTag を targetTag に統合する。source のレシピ紐付けを target へ移し、source を削除。 */
export async function mergeTag(
  sourceTagId: string,
  targetTagId: string,
): Promise<void> {
  if (sourceTagId === targetTagId) return;
  const supabase = createServerSupabaseClient();

  // source が付いたレシピ
  const { data: sourceLinks, error: srcErr } = await supabase
    .from("recipe_tags")
    .select("recipe_id")
    .eq("tag_id", sourceTagId);
  if (srcErr) throw srcErr;

  // target が既に付いたレシピ（重複回避）
  const { data: targetLinks, error: tgtErr } = await supabase
    .from("recipe_tags")
    .select("recipe_id")
    .eq("tag_id", targetTagId);
  if (tgtErr) throw tgtErr;

  const targetRecipeIds = new Set((targetLinks ?? []).map((l) => l.recipe_id));
  const toInsert = (sourceLinks ?? [])
    .map((l) => l.recipe_id)
    .filter((rid) => !targetRecipeIds.has(rid))
    .map((rid) => ({ recipe_id: rid, tag_id: targetTagId }));

  if (toInsert.length > 0) {
    const { error: insErr } = await supabase
      .from("recipe_tags")
      .insert(toInsert);
    if (insErr) throw insErr;
  }

  // source タグを削除（紐付けは CASCADE で消える）
  const { error: delErr } = await supabase
    .from("tags")
    .delete()
    .eq("id", sourceTagId);
  if (delErr) throw delErr;
}

/** 指定タグをすべて持つレシピ ID の集合（AND 条件）。tagIds が空なら null（=絞り込みなし）。 */
export async function recipeIdsWithAllTags(
  tagIds: string[],
): Promise<string[] | null> {
  if (tagIds.length === 0) return null;
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("recipe_tags")
    .select("recipe_id, tag_id")
    .in("tag_id", tagIds);
  if (error) throw error;

  const tagsByRecipe = new Map<string, Set<string>>();
  for (const link of data ?? []) {
    if (!tagsByRecipe.has(link.recipe_id)) {
      tagsByRecipe.set(link.recipe_id, new Set());
    }
    tagsByRecipe.get(link.recipe_id)!.add(link.tag_id);
  }

  const required = tagIds.length;
  const result: string[] = [];
  for (const [recipeId, set] of tagsByRecipe) {
    if (set.size >= required) result.push(recipeId);
  }
  return result;
}
