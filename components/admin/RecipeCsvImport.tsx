"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importRecipesCsvAction } from "@/app/actions/import";
import type { ImportResult } from "@/lib/csv/types";
import { Spinner } from "@/components/ui/Spinner";

type CsvEncoding = "utf-8" | "shift-jis";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:bg-background-focus";

export function RecipeCsvImport() {
  const router = useRouter();
  const [encoding, setEncoding] = useState<CsvEncoding>("utf-8");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("CSV ファイルを選択してください");
      return;
    }

    const formData = new FormData();
    formData.set("encoding", encoding);
    formData.set("file", file);

    startTransition(async () => {
      const res = await importRecipesCsvAction(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setResult(res.data);
      setFile(null);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-sm font-medium text-foreground">CSV 形式</h2>
        <p className="mt-2 text-sm text-muted">
          ヘッダー行は不要です。列は左から「タイトル, 材料, 作り方, その他,
          タグ」の順に並べてください。1 回の取込は 500 行まで、ファイルサイズは
          5MB 以内です。
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="py-2 pr-4 font-normal">列</th>
                <th className="py-2 pr-4 font-normal">必須</th>
                <th className="py-2 font-normal">説明</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">1列目: タイトル</td>
                <td className="py-2 pr-4">必須</td>
                <td className="py-2">200 文字以内</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">2列目: 材料</td>
                <td className="py-2 pr-4">任意</td>
                <td className="py-2">改行可（引用符で囲む）</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">3列目: 作り方</td>
                <td className="py-2 pr-4">任意</td>
                <td className="py-2">改行可（引用符で囲む）</td>
              </tr>
              <tr className="border-b border-border/60">
                <td className="py-2 pr-4">4列目: その他</td>
                <td className="py-2 pr-4">任意</td>
                <td className="py-2">メモなど</td>
              </tr>
              <tr>
                <td className="py-2 pr-4">5列目: タグ</td>
                <td className="py-2 pr-4">任意</td>
                <td className="py-2">
                  複数タグは <code className="text-xs">|</code>{" "}
                  区切り（例: 和食|簡単）
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-foreground">
            文字コード
          </legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="encoding"
                value="utf-8"
                checked={encoding === "utf-8"}
                onChange={() => setEncoding("utf-8")}
                className="accent-accent"
              />
              UTF-8
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="encoding"
                value="shift-jis"
                checked={encoding === "shift-jis"}
                onChange={() => setEncoding("shift-jis")}
                className="accent-accent"
              />
              Shift-JIS（S-JIS）
            </label>
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor="csv-file" className="text-sm font-medium text-foreground">
            CSV ファイル
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {result && (
          <div
            role="status"
            className="rounded-lg border border-border bg-background px-4 py-3 text-sm"
          >
            <p className="text-foreground">
              {result.imported} 件のレシピを取り込みました。
            </p>
            {result.errors.length > 0 && (
              <div className="mt-2">
                <p className="text-muted">
                  {result.errors.length} 行でエラーがありました:
                </p>
                <ul className="mt-1 max-h-40 list-inside list-disc overflow-y-auto text-red-600">
                  {result.errors.map((err) => (
                    <li key={`${err.row}-${err.message}`}>
                      {err.row} 行目: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || !file}
          className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending && <Spinner className="h-4 w-4" label="取込中" />}
          取り込む
        </button>
      </form>
    </div>
  );
}
