import "server-only";
import { parseCsv } from "@/lib/csv/parse";
import type { ImportResult, ImportRowError } from "@/lib/csv/types";
import { createRecipe, type RecipeInput } from "@/lib/recipes";

export type { ImportResult, ImportRowError };

const MAX_ROWS = 500;

function parseTagNames(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean);
}

function validateRecipeInput(input: RecipeInput): string | null {
  if (!input.title.trim()) return "タイトルを入力してください";
  if (input.title.trim().length > 200) {
    return "タイトルは 200 文字以内で入力してください";
  }
  return null;
}

function rowToRecipeInput(cells: string[]): RecipeInput {
  // 列順: タイトル, 材料, 作り方, その他, タグ
  return {
    title: cells[0] ?? "",
    ingredients: cells[1] ?? "",
    instructions: cells[2] ?? "",
    notes: cells[3] ?? "",
    tagNames: parseTagNames(cells[4] ?? ""),
  };
}

/** CSV テキストからレシピを一括取込する。行単位のエラーは記録しつつ続行する。 */
export async function importRecipesFromCsv(
  csvText: string,
  userId: string,
): Promise<ImportResult> {
  const trimmed = csvText.trim();
  if (!trimmed) {
    throw new Error("CSV ファイルが空です");
  }

  const table = parseCsv(trimmed);
  const dataRows = table.filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  );

  if (dataRows.length === 0) {
    throw new Error("取り込むデータ行がありません");
  }
  if (dataRows.length > MAX_ROWS) {
    throw new Error(`1 回の取込は ${MAX_ROWS} 行までです`);
  }

  const errors: ImportRowError[] = [];
  let imported = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const rowNumber = i + 1;
    const input = rowToRecipeInput(dataRows[i]);
    const validationError = validateRecipeInput(input);
    if (validationError) {
      errors.push({ row: rowNumber, message: validationError });
      continue;
    }

    try {
      await createRecipe(input, userId);
      imported++;
    } catch {
      errors.push({ row: rowNumber, message: "レシピの作成に失敗しました" });
    }
  }

  return { imported, errors };
}
