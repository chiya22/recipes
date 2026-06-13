"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAction,
  updateUserAction,
  deleteUserAction,
} from "@/app/actions/users";
import type { Role, User } from "@/types";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:bg-background-focus";

type Draft = {
  loginId: string;
  name: string;
  role: Role;
  email: string;
  password: string;
};

function emptyDraft(): Draft {
  return { loginId: "", name: "", role: "user", email: "", password: "" };
}

export function UserManager({
  users,
  currentUserId,
}: {
  users: User[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{users.length} 人のユーザー</p>
        <button
          type="button"
          onClick={() => {
            setCreating((v) => !v);
            setError(null);
          }}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
        >
          {creating ? "閉じる" : "ユーザーを追加"}
        </button>
      </div>

      {creating && (
        <CreateForm
          pending={pending}
          onCancel={() => setCreating(false)}
          onSubmit={(draft) => {
            setError(null);
            startTransition(async () => {
              const result = await createUserAction({
                loginId: draft.loginId,
                name: draft.name,
                role: draft.role,
                password: draft.password,
                email: draft.email || undefined,
              });
              if (result.ok) {
                setCreating(false);
                refresh();
              } else {
                setError(result.error);
              }
            });
          }}
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {users.map((user) =>
          editingId === user.id ? (
            <li
              key={user.id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <EditForm
                user={user}
                isSelf={user.id === currentUserId}
                pending={pending}
                onCancel={() => setEditingId(null)}
                onSubmit={(patch) => {
                  setError(null);
                  startTransition(async () => {
                    const result = await updateUserAction(user.id, patch);
                    if (result.ok) {
                      setEditingId(null);
                      refresh();
                    } else {
                      setError(result.error);
                    }
                  });
                }}
              />
            </li>
          ) : (
            <li
              key={user.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {user.name}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      user.role === "admin"
                        ? "bg-accent/10 text-accent"
                        : "bg-black/5 text-muted"
                    }`}
                  >
                    {user.role === "admin" ? "管理者" : "一般"}
                  </span>
                  {user.id === currentUserId && (
                    <span className="text-xs text-muted">（自分）</span>
                  )}
                </div>
                <p className="truncate text-xs text-muted">
                  ID: {user.loginId}
                  {user.email ? ` ・ ${user.email}` : " ・ メール未設定"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(user.id);
                    setError(null);
                  }}
                  className="h-8 rounded-lg px-3 text-sm text-muted hover:bg-black/5"
                >
                  編集
                </button>
                <button
                  type="button"
                  disabled={user.id === currentUserId || pending}
                  onClick={() => {
                    if (!confirm(`ユーザー「${user.name}」を削除しますか？`)) {
                      return;
                    }
                    setError(null);
                    startTransition(async () => {
                      const result = await deleteUserAction(user.id);
                      if (result.ok) refresh();
                      else setError(result.error);
                    });
                  }}
                  className="h-8 rounded-lg px-3 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                >
                  削除
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}

function CreateForm({
  pending,
  onSubmit,
  onCancel,
}: {
  pending: boolean;
  onSubmit: (draft: Draft) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  function set<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(draft);
      }}
      className="grid grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2"
    >
      <Field label="ログイン ID">
        <input
          className={inputClass}
          value={draft.loginId}
          onChange={(e) => set("loginId", e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="表示名">
        <input
          className={inputClass}
          value={draft.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </Field>
      <Field label="メール（任意）">
        <input
          type="email"
          className={inputClass}
          value={draft.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field label="ロール">
        <RoleSelect value={draft.role} onChange={(r) => set("role", r)} />
      </Field>
      <Field label="パスワード（8 文字以上）">
        <input
          type="password"
          className={inputClass}
          value={draft.password}
          onChange={(e) => set("password", e.target.value)}
        />
      </Field>
      <div className="flex items-end justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg px-3 text-sm text-muted hover:bg-black/5"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "作成中..." : "作成"}
        </button>
      </div>
    </form>
  );
}

function EditForm({
  user,
  isSelf,
  pending,
  onSubmit,
  onCancel,
}: {
  user: User;
  isSelf: boolean;
  pending: boolean;
  onSubmit: (patch: {
    name?: string;
    role?: Role;
    email?: string | null;
    password?: string;
  }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [email, setEmail] = useState(user.email ?? "");
  const [password, setPassword] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          name,
          role,
          email: email || null,
          password: password || undefined,
        });
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      <Field label={`表示名（ID: ${user.loginId}）`}>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="メール">
        <input
          type="email"
          className={inputClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>
      <Field label="ロール">
        <RoleSelect
          value={role}
          onChange={setRole}
          disabled={isSelf}
        />
        {isSelf && (
          <span className="text-xs text-muted">自分の権限は変更できません</span>
        )}
      </Field>
      <Field label="パスワード（変更する場合のみ）">
        <input
          type="password"
          className={inputClass}
          value={password}
          placeholder="••••••••"
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <div className="flex items-end justify-end gap-2 sm:col-span-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-9 rounded-lg px-3 text-sm text-muted hover:bg-black/5"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "保存中..." : "保存"}
        </button>
      </div>
    </form>
  );
}

function RoleSelect({
  value,
  onChange,
  disabled,
}: {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}) {
  return (
    <select
      className={inputClass}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Role)}
    >
      <option value="user">一般</option>
      <option value="admin">管理者</option>
    </select>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
