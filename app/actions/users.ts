"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import {
  createUser,
  updateUser,
  deleteUser,
  UserError,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/lib/users";
import type { Role, User } from "@/types";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function requireAdmin(): Promise<
  { ok: true; user: User } | { ok: false; error: string }
> {
  const user = await requireUser();
  if (user.role !== "admin") {
    return { ok: false, error: "管理者権限が必要です" };
  }
  return { ok: true, user };
}

const VALID_ROLES: Role[] = ["admin", "user"];

function validateLoginId(loginId: string): string | null {
  const v = loginId.trim();
  if (!v) return "ログイン ID を入力してください";
  if (v.length > 50) return "ログイン ID は 50 文字以内で入力してください";
  if (!/^[A-Za-z0-9_.-]+$/.test(v)) {
    return "ログイン ID は半角英数字と _ . - のみ使用できます";
  }
  return null;
}

function validateName(name: string): string | null {
  if (!name.trim()) return "表示名を入力してください";
  if (name.trim().length > 100) return "表示名は 100 文字以内で入力してください";
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "パスワードは 8 文字以上で入力してください";
  if (password.length > 200) return "パスワードが長すぎます";
  return null;
}

function validateEmail(email: string | undefined): string | null {
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return "メールアドレスの形式が正しくありません";
  }
  return null;
}

export async function createUserAction(
  input: CreateUserInput,
): Promise<ActionResult<User>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  const checks = [
    validateLoginId(input.loginId),
    validateName(input.name),
    validatePassword(input.password),
    validateEmail(input.email),
  ];
  const err = checks.find((c) => c !== null);
  if (err) return { ok: false, error: err };
  if (!VALID_ROLES.includes(input.role)) {
    return { ok: false, error: "ロールが不正です" };
  }

  try {
    const user = await createUser(input);
    revalidatePath("/admin/users");
    return { ok: true, data: user };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    return { ok: false, error: "ユーザーの作成に失敗しました" };
  }
}

export async function updateUserAction(
  id: string,
  input: UpdateUserInput,
): Promise<ActionResult<User>> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (input.name !== undefined) {
    const e = validateName(input.name);
    if (e) return { ok: false, error: e };
  }
  if (input.password) {
    const e = validatePassword(input.password);
    if (e) return { ok: false, error: e };
  }
  if (input.email !== undefined && input.email !== null) {
    const e = validateEmail(input.email);
    if (e) return { ok: false, error: e };
  }
  if (input.role && !VALID_ROLES.includes(input.role)) {
    return { ok: false, error: "ロールが不正です" };
  }
  // 自分自身の admin 権限を剥奪してロックアウトされるのを防ぐ
  if (input.role === "user" && id === auth.user.id) {
    return { ok: false, error: "自分自身の管理者権限は変更できません" };
  }

  try {
    const user = await updateUser(id, input);
    revalidatePath("/admin/users");
    return { ok: true, data: user };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    return { ok: false, error: "ユーザーの更新に失敗しました" };
  }
}

export async function deleteUserAction(id: string): Promise<ActionResult> {
  const auth = await requireAdmin();
  if (!auth.ok) return auth;

  if (id === auth.user.id) {
    return { ok: false, error: "自分自身は削除できません" };
  }

  try {
    await deleteUser(id);
    revalidatePath("/admin/users");
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof UserError) return { ok: false, error: e.message };
    return { ok: false, error: "ユーザーの削除に失敗しました" };
  }
}
