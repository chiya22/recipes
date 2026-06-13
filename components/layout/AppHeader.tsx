import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SearchBar } from "@/components/layout/SearchBar";
import type { User } from "@/types";

type AppHeaderProps = {
  user: User;
  /** 現在地（リンク強調用） */
  active?: "home" | "trash" | "admin";
  /** 検索バーの初期値（ホームのみ表示） */
  searchQuery?: string;
};

export function AppHeader({ user, active, searchQuery }: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-surface px-3 sm:gap-4 sm:px-4"
      style={{ height: "var(--header-height)" }}
    >
      <Link
        href="/"
        className="shrink-0 text-xl font-medium text-foreground"
      >
        レシピ
      </Link>

      <div className="ml-1 flex-1 sm:ml-2">
        {active === "home" && <SearchBar initialQuery={searchQuery} />}
      </div>

      <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-1">
        <Link
          href="/"
          className={`rounded-lg px-3 py-1.5 hover:bg-background ${
            active === "home" ? "font-medium text-foreground" : "text-muted"
          }`}
        >
          ホーム
        </Link>
        <Link
          href="/trash"
          className={`rounded-lg px-3 py-1.5 hover:bg-background ${
            active === "trash" ? "font-medium text-foreground" : "text-muted"
          }`}
        >
          ゴミ箱
        </Link>
        {user.role === "admin" && (
          <Link
            href="/admin/users"
            className={`rounded-lg px-3 py-1.5 hover:bg-background ${
              active === "admin" ? "font-medium text-foreground" : "text-muted"
            }`}
          >
            管理
          </Link>
        )}
      </nav>

      <span className="hidden shrink-0 text-sm text-muted lg:inline">
        {user.name}
        {user.role === "admin" ? "（管理者）" : ""}
      </span>
      <LogoutButton />
    </header>
  );
}
