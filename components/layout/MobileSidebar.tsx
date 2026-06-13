"use client";

import { useEffect, useState } from "react";
import { SidebarContent } from "./Sidebar";
import type { TagWithCount } from "@/types";

/**
 * モバイル用のタグ絞り込みドロワー（md 未満で表示）。
 * フィルタボタン → 左からスライドインするオーバーレイ。
 */
export function MobileSidebar({
  tags,
  selected,
}: {
  tags: TagWithCount[];
  selected: string[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M3 6h18M6 12h12M10 18h4" />
        </svg>
        タグで絞り込み
        {selected.length > 0 && (
          <span className="rounded-full bg-accent px-1.5 text-xs font-medium text-white">
            {selected.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="タグで絞り込み"
            className="h-full w-72 max-w-[80%] overflow-y-auto bg-surface py-4 shadow-xl"
          >
            <div className="flex items-center justify-between px-4 pb-2">
              <span className="text-sm font-medium text-foreground">
                絞り込み
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="閉じる"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-black/5"
              >
                ×
              </button>
            </div>
            <SidebarContent
              tags={tags}
              selected={selected}
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
