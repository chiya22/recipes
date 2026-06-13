import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="text-center text-2xl font-medium text-foreground">レシピ</h1>
        <p className="mt-1 text-center text-sm text-muted">ログインしてください</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
