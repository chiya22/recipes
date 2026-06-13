import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { User } from "@/types";

type AppHeaderProps = {
  user: User;
  /** 現在地（リンク強調用） */
  active?: "home" | "trash" | "admin";
};

export function AppHeader({ user, active }: AppHeaderProps) {
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

      <div className="flex-1" />

      <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-1">
        <Link
          href="/"
          aria-label="ホーム"
          title="ホーム"
          className={`rounded-lg p-2 hover:bg-background ${
            active === "home" ? "text-foreground" : "text-muted"
          }`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </svg>
        </Link>
        <Link
          href="/trash"
          aria-label="ゴミ箱"
          title="ゴミ箱"
          className={`rounded-lg p-2 hover:bg-background ${
            active === "trash" ? "text-foreground" : "text-muted"
          }`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </Link>
        {user.role === "admin" && (
          <Link
            href="/admin/users"
            aria-label="管理"
            title="管理"
            className={`rounded-lg p-2 hover:bg-background ${
              active === "admin" ? "text-foreground" : "text-muted"
            }`}
          >
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
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
