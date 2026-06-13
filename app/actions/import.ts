"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { decodeCsvText, isCsvEncoding } from "@/lib/csv/decode";
import {
  importRecipesFromCsv,
} from "@/lib/csv/recipes";
import type { ImportResult } from "@/lib/csv/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    return { ok: false as const, error: "管理者権限が必要です" };
  }
  return { ok: true as const, user };
}

export async function importRecipesCsvAction(
  formData: FormData,
): Promise<ActionResult<ImportResult>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const encodingRaw = formData.get("encoding");
  if (!isCsvEncoding(encodingRaw)) {
    return { ok: false, error: "文字コードを選択してください" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "CSV ファイルを選択してください" };
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    return { ok: false, error: "CSV ファイル（.csv）を選択してください" };
  }

  try {
    const buffer = await file.arrayBuffer();
    const csvText = decodeCsvText(buffer, encodingRaw);
    const result = await importRecipesFromCsv(csvText, auth.user.id);
    revalidatePath("/");
    revalidatePath("/admin/import");
    return { ok: true, data: result };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "CSV の取込に失敗しました";
    return { ok: false, error: message };
  }
}
