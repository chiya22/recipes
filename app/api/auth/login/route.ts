import { NextResponse } from "next/server";
import { getUserCredentialByLoginId } from "@/lib/users";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }

  const { loginId, password } = (body ?? {}) as {
    loginId?: unknown;
    password?: unknown;
  };

  if (typeof loginId !== "string" || typeof password !== "string" || !loginId || !password) {
    return NextResponse.json(
      { error: "ログイン ID とパスワードを入力してください" },
      { status: 400 },
    );
  }

  let credential: Awaited<ReturnType<typeof getUserCredentialByLoginId>>;
  try {
    credential = await getUserCredentialByLoginId(loginId);
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました" },
      { status: 500 },
    );
  }

  // ユーザー不在でもパスワード検証時間を擬似的に揃えるため、ダミーハッシュで比較する
  const DUMMY_HASH = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8DvERFux7r4Cw0v0v0v0v0v0v0v0v";
  const passwordHash = credential?.passwordHash ?? DUMMY_HASH;
  const valid = await verifyPassword(password, passwordHash);

  if (!credential || !valid) {
    return NextResponse.json(
      { error: "ログイン ID またはパスワードが正しくありません" },
      { status: 401 },
    );
  }

  await createSession({
    userId: credential.user.id,
    loginId: credential.user.loginId,
    name: credential.user.name,
    role: credential.user.role,
  });

  return NextResponse.json({ user: credential.user });
}
