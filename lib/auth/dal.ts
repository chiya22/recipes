import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "@/lib/auth/session";
import type { Role, User } from "@/types";

/**
 * Data Access Layer（DAL）。
 * セッション検証と認可ロジックを集約する。
 *
 * Cookie の JWT は自前で署名・検証しているため、ペイロードの内容は信頼できる。
 * （Supabase Auth の user_metadata のようにユーザー編集可能ではない）
 */

/** セッション（Cookie の JWT ペイロード）を返す。未ログインなら null。 */
export const getCurrentSession = cache(
  async (): Promise<SessionPayload | null> => {
    return getSession();
  },
);

/** ログイン中のユーザー概要を返す。未ログインなら null。 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const session = await getCurrentSession();
  if (!session) return null;
  return {
    id: session.userId,
    loginId: session.loginId,
    name: session.name,
    role: session.role,
  };
});

/** 認証必須。未ログインなら /login へリダイレクト。 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** 指定ロール必須。権限不足なら / へリダイレクト。 */
export async function requireRole(role: Role): Promise<User> {
  const user = await requireUser();
  if (user.role !== role) redirect("/");
  return user;
}
