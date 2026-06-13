"use client";

import { useRouter } from "next/navigation";
import type { TagWithCount } from "@/types";

type SidebarProps = {
  tags: TagWithCount[];
  /** 選択中のタグ ID */
  selected: string[];
};

/** タグ選択を URL の ?tags= に反映するための共有フック。 */
function useTagFilter(selected: string[]) {
  const router = useRouter();
  const selectedSet = new Set(selected);

  function apply(next: string[]) {
    const params = new URLSearchParams();
    if (next.length > 0) params.set("tags", next.join(","));
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function toggle(id: string) {
    if (selectedSet.has(id)) apply(selected.filter((t) => t !== id));
    else apply([...selected, id]);
  }

  return { selectedSet, apply, toggle };
}

/**
 * サイドバーのタグ一覧本体（デスクトップ aside / モバイルドロワーで共用）。
 */
export function SidebarContent({
  tags,
  selected,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const { selectedSet, apply, toggle } = useTagFilter(selected);

  return (
    <nav className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={() => {
          apply([]);
          onNavigate?.();
        }}
        className={`flex items-center justify-between rounded-r-full px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 ${
          selected.length === 0
            ? "bg-accent/10 font-medium text-foreground"
            : "text-muted"
        }`}
      >
        すべてのレシピ
      </button>

      {tags.length > 0 && (
        <p className="mt-3 px-4 pb-1 text-xs font-medium text-muted">タグ</p>
      )}

      {tags.map((tag) => {
        const active = selectedSet.has(tag.id);
        return (
          <button
            key={tag.id}
            type="button"
            onClick={() => {
              toggle(tag.id);
              onNavigate?.();
            }}
            aria-pressed={active}
            className={`flex items-center justify-between gap-2 rounded-r-full px-4 py-2 text-left text-sm transition-colors hover:bg-black/5 ${
              active ? "bg-accent/10 font-medium text-foreground" : "text-muted"
            }`}
          >
            <span className="truncate">{tag.name}</span>
            <span className="shrink-0 text-xs text-muted">{tag.count}</span>
          </button>
        );
      })}

      {tags.length === 0 && (
        <p className="px-4 py-2 text-xs text-muted">タグがまだありません</p>
      )}
    </nav>
  );
}

/**
 * デスクトップ用の固定サイドバー（md 以上で表示）。
 */
export function Sidebar({ tags, selected }: SidebarProps) {
  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-[calc(var(--header-height)+1.5rem)]">
        <SidebarContent tags={tags} selected={selected} />
      </div>
    </aside>
  );
}
