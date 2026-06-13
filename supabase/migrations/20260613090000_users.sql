-- フェーズ 2: users テーブル
-- 認証はカスタム実装（Supabase Auth 不使用）。
-- アプリのサーバー側は service_role キーでアクセスするため RLS をバイパスする。
-- anon / authenticated ロールからのアクセスは RLS で全拒否（ポリシー未定義 = デフォルト拒否）。

create extension if not exists pgcrypto;

create table if not exists public.users (
  id            uuid primary key default gen_random_uuid(),
  login_id      text unique not null,
  name          text not null,
  role          text not null check (role in ('admin', 'user')),
  password_hash text not null,
  email         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- updated_at 自動更新トリガー（他テーブルでも再利用する共通関数）
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

-- RLS 有効化（service_role はバイパス。anon/authenticated はポリシー無し = 全拒否）
alter table public.users enable row level security;
