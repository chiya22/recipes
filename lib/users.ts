import "server-only";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashPassword } from "@/lib/auth/password";
import type { Role, User } from "@/types";

type UserRow = {
  id: string;
  login_id: string;
  name: string;
  role: Role;
  email: string | null;
};

const USER_COLUMNS = "id, login_id, name, role, email";

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    loginId: row.login_id,
    name: row.name,
    role: row.role,
    email: row.email ?? undefined,
  };
}

/** ログイン照合用。password_hash を含む生データを返す（取り扱い注意）。 */
export async function getUserCredentialByLoginId(
  loginId: string,
): Promise<{ user: User; passwordHash: string } | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select(`${USER_COLUMNS}, password_hash`)
    .eq("login_id", loginId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { password_hash, ...rest } = data as UserRow & { password_hash: string };
  return { user: mapUser(rest), passwordHash: password_hash };
}

/** 通知先となる admin のメールアドレス一覧（email 未設定は除外）。 */
export async function listAdminEmails(): Promise<
  { id: string; email: string }[]
> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("role", "admin")
    .not("email", "is", null);
  if (error) throw error;
  return (data ?? [])
    .filter((u): u is { id: string; email: string } => !!u.email)
    .map((u) => ({ id: u.id, email: u.email }));
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapUser(data as UserRow);
}

/** ユーザー操作の検証エラー（呼び出し側でメッセージを表示する）。 */
export class UserError extends Error {}

export async function listUsers(): Promise<User[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select(USER_COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => mapUser(row as UserRow));
}

/** role='admin' の人数。最後の admin を保護するために使用。 */
export async function countAdmins(): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw error;
  return count ?? 0;
}

export type CreateUserInput = {
  loginId: string;
  name: string;
  role: Role;
  password: string;
  email?: string;
};

export async function createUser(input: CreateUserInput): Promise<User> {
  const supabase = createServerSupabaseClient();
  const loginId = input.loginId.trim();
  const email = input.email?.trim() || null;

  const { data: existing, error: existErr } = await supabase
    .from("users")
    .select("id")
    .eq("login_id", loginId)
    .maybeSingle();
  if (existErr) throw existErr;
  if (existing) throw new UserError("このログイン ID は既に使われています");

  const passwordHash = await hashPassword(input.password);
  const { data, error } = await supabase
    .from("users")
    .insert({
      login_id: loginId,
      name: input.name.trim(),
      role: input.role,
      password_hash: passwordHash,
      email,
    })
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return mapUser(data as UserRow);
}

export type UpdateUserInput = {
  name?: string;
  role?: Role;
  email?: string | null;
  password?: string;
};

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User> {
  const supabase = createServerSupabaseClient();

  const target = await getUserById(id);
  if (!target) throw new UserError("ユーザーが見つかりません");

  // 最後の admin を user に降格させない
  if (input.role === "user" && target.role === "admin") {
    const admins = await countAdmins();
    if (admins <= 1) {
      throw new UserError("最後の管理者の権限は変更できません");
    }
  }

  const patch: {
    name?: string;
    role?: Role;
    email?: string | null;
    password_hash?: string;
  } = {};
  if (typeof input.name === "string") patch.name = input.name.trim();
  if (input.role) patch.role = input.role;
  if (input.email !== undefined) patch.email = input.email?.trim() || null;
  if (input.password) patch.password_hash = await hashPassword(input.password);

  const { data, error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", id)
    .select(USER_COLUMNS)
    .single();
  if (error) throw error;
  return mapUser(data as UserRow);
}

export async function deleteUser(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();

  const target = await getUserById(id);
  if (!target) throw new UserError("ユーザーが見つかりません");

  if (target.role === "admin") {
    const admins = await countAdmins();
    if (admins <= 1) {
      throw new UserError("最後の管理者は削除できません");
    }
  }

  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw error;
}
