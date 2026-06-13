"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-lg font-medium text-foreground">
        問題が発生しました
      </h1>
      <p className="text-sm text-muted">
        一時的なエラーの可能性があります。もう一度お試しください。
      </p>
      <button
        type="button"
        onClick={reset}
        className="h-10 rounded-lg bg-accent px-5 text-sm font-medium text-white hover:opacity-90"
      >
        再試行
      </button>
    </div>
  );
}
