-- フェーズ 3: レシピ関連スキーマ（recipes / tags / recipe_tags / recipe_images）
-- 全文検索は日本語対応のため PGroonga を使用する。
-- （設計書記載の pg_bigm は当 Supabase プロジェクトで利用不可のため代替採用）

create extension if not exists pgroonga;

-- ============================================================
-- recipes
-- ============================================================
create table if not exists public.recipes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  ingredients  text not null default '',
  instructions text not null default '',
  notes        text not null default '',
  color        text not null default 'default',
  created_by   uuid references public.users (id) on delete set null,
  updated_by   uuid references public.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
  before update on public.recipes
  for each row
  execute function public.set_updated_at();

-- 一覧・ソート・ゴミ箱フィルタ用
create index if not exists recipes_title_idx
  on public.recipes (title)
  where deleted_at is null;
create index if not exists recipes_deleted_at_idx
  on public.recipes (deleted_at);

-- 日本語全文検索（PGroonga: 部分一致 &@ / クエリ &@~ をインデックスで高速化）
create index if not exists recipes_title_pgroonga_idx
  on public.recipes using pgroonga (title);
create index if not exists recipes_ingredients_pgroonga_idx
  on public.recipes using pgroonga (ingredients);
create index if not exists recipes_instructions_pgroonga_idx
  on public.recipes using pgroonga (instructions);
create index if not exists recipes_notes_pgroonga_idx
  on public.recipes using pgroonga (notes);

alter table public.recipes enable row level security;

-- ============================================================
-- tags
-- ============================================================
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text unique not null,
  color      text not null default 'default',
  created_at timestamptz not null default now()
);

alter table public.tags enable row level security;

-- ============================================================
-- recipe_tags（中間テーブル）
-- ============================================================
create table if not exists public.recipe_tags (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  tag_id    uuid not null references public.tags (id) on delete cascade,
  primary key (recipe_id, tag_id)
);

-- タグ使用回数集計・絞り込み用
create index if not exists recipe_tags_tag_id_idx
  on public.recipe_tags (tag_id);

alter table public.recipe_tags enable row level security;

-- ============================================================
-- recipe_images
-- ============================================================
create table if not exists public.recipe_images (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid not null references public.recipes (id) on delete cascade,
  storage_path text not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists recipe_images_recipe_id_idx
  on public.recipe_images (recipe_id);

alter table public.recipe_images enable row level security;
