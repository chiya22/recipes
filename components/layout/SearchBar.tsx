"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";

/**
 * ホームのレシピ全文検索バー。
 * 入力をデバウンスして URL の ?q= を更新する。?tags= は維持する。
 */
export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();
  // 直近で URL に反映した値（自分の push による searchParams 変化での上書きを防ぐ）
  const lastPushed = useRef(initialQuery);

  // 外部要因（戻る/進む・サイドバー操作）で q が変わったら入力欄へ反映
  useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    if (urlQuery !== lastPushed.current) {
      lastPushed.current = urlQuery;
      setValue(urlQuery);
    }
  }, [searchParams]);

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = searchParams.get("q") ?? "";
      const next = value.trim();
      if (next === current) return;

      const params = new URLSearchParams(searchParams.toString());
      if (next) params.set("q", next);
      else params.delete("q");

      lastPushed.current = next;
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/?${qs}` : "/");
      });
    }, 300);

    return () => clearTimeout(handle);
  }, [value, router, searchParams]);

  return (
    <div className="flex h-10 max-w-xl items-center gap-2 rounded-lg bg-background px-3 text-sm transition-colors focus-within:bg-background-focus">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="レシピを検索（材料・作り方・タグも対象）"
        aria-label="レシピを検索"
        className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted"
      />
      {isPending && <Spinner className="h-4 w-4 shrink-0 text-muted" />}
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          aria-label="検索をクリア"
          className="shrink-0 text-muted hover:text-foreground"
        >
          ×
        </button>
      )}
    </div>
  );
}
