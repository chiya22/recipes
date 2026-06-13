"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(data?.error ?? "ログインに失敗しました");
        return;
      }
      const next = searchParams.get("next") || "/";
      router.replace(next);
      router.refresh();
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="loginId" className="text-sm text-muted">
          ログイン ID
        </label>
        <input
          id="loginId"
          name="loginId"
          type="text"
          autoComplete="username"
          required
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:bg-background-focus"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-muted">
          パスワード
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:bg-background-focus"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 h-10 rounded-lg bg-accent text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "ログイン中..." : "ログイン"}
      </button>
    </form>
  );
}
