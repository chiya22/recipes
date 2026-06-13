"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { Tag } from "@/types";

type TagOption = Tag & { count?: number };

type TagPickerProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags?: TagOption[];
};

export function TagPicker({
  value,
  onChange,
  availableTags = [],
}: TagPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    searchRef.current?.focus();

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const selectedSet = new Set(value);
  const trimmedQuery = query.trim();
  const q = trimmedQuery.toLowerCase();

  const filtered = availableTags
    .filter((t) => !q || t.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const aSel = selectedSet.has(a.name) ? 0 : 1;
      const bSel = selectedSet.has(b.name) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      return a.name.localeCompare(b.name, "ja");
    });

  const exactMatchInList =
    q.length > 0 &&
    availableTags.some((t) => t.name.toLowerCase() === q);
  const alreadySelected =
    q.length > 0 && value.some((v) => v.toLowerCase() === q);
  const canCreateFromSearch =
    q.length > 0 && !exactMatchInList && !alreadySelected;

  function closePopover() {
    setOpen(false);
    setQuery("");
  }

  function toggle(name: string) {
    if (selectedSet.has(name)) {
      onChange(value.filter((t) => t !== name));
    } else {
      onChange([...value, name]);
    }
  }

  function addTag(raw: string) {
    const name = raw.trim();
    if (!name) return false;

    const existing = availableTags.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    const toAdd = existing ? existing.name : name;
    if (value.includes(toAdd)) return false;

    onChange([...value, toAdd]);
    return true;
  }

  function createFromSearch() {
    if (addTag(trimmedQuery)) {
      setQuery("");
    }
  }

  function removeTag(name: string) {
    onChange(value.filter((t) => t !== name));
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <div className="min-w-0 flex-1">
          {value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-foreground"
                >
                  {tag}
                  <button
                    type="button"
                    aria-label={`タグ ${tag} を外す`}
                    onClick={() => removeTag(tag)}
                    className="text-muted hover:text-foreground"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted">未設定</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => (open ? closePopover() : setOpen(true))}
          aria-expanded={open}
          aria-controls={listboxId}
          className="shrink-0 rounded-md px-2 py-0.5 text-sm text-accent hover:bg-accent/5"
        >
          {open ? "閉じる" : "編集"}
        </button>
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canCreateFromSearch) {
                    createFromSearch();
                  } else if (
                    filtered.length === 1 &&
                    !selectedSet.has(filtered[0].name)
                  ) {
                    toggle(filtered[0].name);
                  }
                }
              }}
              placeholder="タグを検索..."
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:bg-background-focus"
            />
          </div>

          <ul
            id={listboxId}
            role="listbox"
            aria-multiselectable="true"
            className="max-h-48 overflow-y-auto py-1"
          >
            {filtered.length === 0 && !canCreateFromSearch && (
              <li className="px-3 py-2 text-xs text-muted">
                該当するタグがありません
              </li>
            )}
            {filtered.map((tag) => {
              const checked = selectedSet.has(tag.name);
              return (
                <li key={tag.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={checked}
                    onClick={() => toggle(tag.name)}
                    className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-black/5"
                  >
                    <span
                      aria-hidden
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        checked
                          ? "border-accent bg-accent text-white"
                          : "border-border bg-background"
                      }`}
                    >
                      {checked && (
                        <svg
                          viewBox="0 0 12 12"
                          className="h-2.5 w-2.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-left">
                      {tag.name}
                    </span>
                    {tag.count != null && (
                      <span className="shrink-0 text-xs text-muted">
                        {tag.count}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {canCreateFromSearch && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={createFromSearch}
                className="w-full rounded-md px-3 py-1.5 text-left text-sm text-accent hover:bg-accent/5"
              >
                「{trimmedQuery}」を追加
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
