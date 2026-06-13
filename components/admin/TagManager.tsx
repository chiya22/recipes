"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateTagAction,
  deleteTagAction,
  mergeTagAction,
} from "@/app/actions/tags";
import type { TagWithCount } from "@/types";

const inputClass =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:bg-background-focus";

export function TagManager({ tags }: { tags: TagWithCount[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mergingId, setMergingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  if (tags.length === 0) {
    return <p className="text-sm text-muted">タグがまだありません。</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted">{tags.length} 個のタグ</p>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {tags.map((tag) => {
          if (editingId === tag.id) {
            return (
              <li
                key={tag.id}
                className="rounded-xl border border-border bg-surface p-3"
              >
                <EditForm
                  tag={tag}
                  pending={pending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(name) => {
                    setError(null);
                    startTransition(async () => {
                      const result = await updateTagAction(tag.id, { name });
                      if (result.ok) {
                        setEditingId(null);
                        refresh();
                      } else {
                        setError(result.error);
                      }
                    });
                  }}
                />
              </li>
            );
          }

          if (mergingId === tag.id) {
            return (
              <li
                key={tag.id}
                className="rounded-xl border border-border bg-surface p-3"
              >
                <MergeForm
                  tag={tag}
                  others={tags.filter((t) => t.id !== tag.id)}
                  pending={pending}
                  onCancel={() => setMergingId(null)}
                  onSubmit={(targetId) => {
                    setError(null);
                    startTransition(async () => {
                      const result = await mergeTagAction(tag.id, targetId);
                      if (result.ok) {
                        setMergingId(null);
                        refresh();
                      } else {
                        setError(result.error);
                      }
                    });
                  }}
                />
              </li>
            );
          }

          return (
            <li
              key={tag.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-medium text-foreground">
                  {tag.name}
                </span>
                <span className="shrink-0 text-xs text-muted">
                  {tag.count} 件
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(tag.id);
                    setMergingId(null);
                    setError(null);
                  }}
                  className="h-8 rounded-lg px-3 text-sm text-muted hover:bg-black/5"
                >
                  編集
                </button>
                <button
                  type="button"
                  disabled={tags.length < 2}
                  onClick={() => {
                    setMergingId(tag.id);
                    setEditingId(null);
                    setError(null);
                  }}
                  className="h-8 rounded-lg px-3 text-sm text-muted hover:bg-black/5 disabled:opacity-40"
                >
                  統合
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (
                      !confirm(
                        `タグ「${tag.name}」を削除しますか？（${tag.count} 件のレシピから外れます）`,
                      )
                    ) {
                      return;
                    }
                    setError(null);
                    startTransition(async () => {
                      const result = await deleteTagAction(tag.id);
                      if (result.ok) refresh();
                      else setError(result.error);
                    });
                  }}
                  className="h-8 rounded-lg px-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  削除
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EditForm({
  tag,
  pending,
  onSubmit,
  onCancel,
}: {
  tag: TagWithCount;
  pending: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(tag.name);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(name);
      }}
      className="flex flex-col gap-3"
    >
      <input
        className={inputClass}
        value={name}
        onChange={(e) => setName(e.target.value)}
        autoFocus
        maxLength={50}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg px-3 text-sm text-muted hover:bg-black/5"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

function MergeForm({
  tag,
  others,
  pending,
  onSubmit,
  onCancel,
}: {
  tag: TagWithCount;
  others: TagWithCount[];
  pending: boolean;
  onSubmit: (targetId: string) => void;
  onCancel: () => void;
}) {
  const [targetId, setTargetId] = useState(others[0]?.id ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (targetId) onSubmit(targetId);
      }}
      className="flex flex-col gap-3"
    >
      <p className="text-sm text-foreground">
        「{tag.name}」を次のタグに統合します（このタグは削除されます）:
      </p>
      <select
        className={inputClass}
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
      >
        {others.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}（{t.count} 件）
          </option>
        ))}
      </select>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg px-3 text-sm text-muted hover:bg-black/5"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={pending || !targetId}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "統合中..." : "統合"}
        </button>
      </div>
    </form>
  );
}
