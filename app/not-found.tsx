import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-5xl font-bold text-accent">404</p>
      <h1 className="text-lg font-medium text-foreground">
        ページが見つかりません
      </h1>
      <Link
        href="/"
        className="h-10 rounded-lg bg-accent px-5 text-sm font-medium leading-10 text-white hover:opacity-90"
      >
        ホームに戻る
      </Link>
    </div>
  );
}
