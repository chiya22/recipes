import type { ReactNode } from "react";

type MasonryProps = {
  children: ReactNode;
  /** ブレークポイントごとの列数（Docs/UI.md 準拠） */
  className?: string;
};

/**
 * Google Keep 風の Masonry レイアウト。
 *
 * CSS の multi-column を用いた依存ライブラリ不要の実装。
 * 各子要素は `break-inside-avoid` で列内分割を防ぐ。
 * 列数: モバイル 1 / タブレット 2 / デスクトップ 3〜4。
 *
 * 子要素はそれぞれ `mb-4` 等の下マージンを持たせること（カラム間の縦間隔）。
 */
export function Masonry({ children, className }: MasonryProps) {
  return (
    <div
      className={[
        "gap-4 [column-fill:_balance]",
        "columns-1 sm:columns-2 lg:columns-3 xl:columns-4",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

type MasonryItemProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Masonry の各アイテム。列内での分割を防ぎ、縦方向の間隔を確保する。
 */
export function MasonryItem({ children, className }: MasonryItemProps) {
  return (
    <div className={["mb-4 break-inside-avoid", className ?? ""].join(" ")}>
      {children}
    </div>
  );
}
