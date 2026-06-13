"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { updateTag, deleteTag, mergeTag, type TagUpdate } from "@/lib/tags";
import type { Tag } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAdmin(): Promise<ActionResult<true>> {
  const user = await requireUser();
  if (user.role !== "admin") {
    return { ok: false, error: "管理者権限が必要です" };
  }
  return { ok: true, data: true };
}

export async function updateTagAction(
  id: string,
  input: TagUpdate,
): Promise<ActionResult<Tag>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (typeof input.name === "string") {
    const name = input.name.trim();
    if (!name) return { ok: false, error: "タグ名を入力してください" };
    if (name.length > 50) {
      return { ok: false, error: "タグ名は 50 文字以内で入力してください" };
    }
  }

  try {
    const tag = await updateTag(id, input);
    revalidatePath("/");
    return { ok: true, data: tag };
  } catch {
    return { ok: false, error: "タグの更新に失敗しました" };
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  try {
    await deleteTag(id);
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "タグの削除に失敗しました" };
  }
}

export async function mergeTagAction(
  sourceTagId: string,
  targetTagId: string,
): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (sourceTagId === targetTagId) {
    return { ok: false, error: "同じタグ同士は統合できません" };
  }

  try {
    await mergeTag(sourceTagId, targetTagId);
    revalidatePath("/");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "タグの統合に失敗しました" };
  }
}
