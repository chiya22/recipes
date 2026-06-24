"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  RecipePrintView,
  type RecipePrintContent,
} from "./RecipePrintView";

type RecipePrintModalProps = {
  open: boolean;
  onClose: () => void;
  content: RecipePrintContent;
};

/** 印刷プレビュー画面。印刷時はレシピ本文のみを出力する。 */
export function RecipePrintModal({
  open,
  onClose,
  content,
}: RecipePrintModalProps) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        e.stopImmediatePropagation();
        onCloseRef.current();
      }
    };
    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      data-recipe-print
      role="dialog"
      aria-modal="true"
      aria-label="印刷プレビュー"
      className="fixed inset-0 z-[60] flex flex-col bg-background"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3 print:hidden">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-lg px-3 text-sm text-muted hover:bg-black/5"
        >
          戻る
        </button>
        <p className="text-sm font-medium text-foreground">印刷プレビュー</p>
        <button
          type="button"
          onClick={() => window.print()}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
        >
          印刷
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:overflow-visible print:p-0">
        <div className="mx-auto max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <RecipePrintView {...content} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
