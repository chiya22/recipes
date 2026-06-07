# データベース設計

## ER 図（概念）

```
users ──────────────────────────────────────────
  │
  │ (操作者として記録)
  ▼
recipes ────── recipe_tags ────── tags
  │
  └────── recipe_images
```

## テーブル定義

### users

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK, default gen_random_uuid() | 内部 ID |
| login_id | text | UNIQUE, NOT NULL | ログイン用 ID |
| name | text | NOT NULL | 表示名 |
| role | text | NOT NULL, CHECK (role IN ('admin','user')) | ロール |
| password_hash | text | NOT NULL | bcrypt ハッシュ |
| email | text | | 通知用メールアドレス |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |

### recipes

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| title | text | NOT NULL | タイトル |
| ingredients | text | | 材料 |
| instructions | text | | 作り方 |
| notes | text | | その他（自由メモ） |
| color | text | NOT NULL, default 'default' | カード色 |
| created_by | uuid | FK → users.id | 作成者 |
| updated_by | uuid | FK → users.id | 最終更新者 |
| created_at | timestamptz | NOT NULL, default now() | |
| updated_at | timestamptz | NOT NULL, default now() | |
| deleted_at | timestamptz | | NULL = 有効、NOT NULL = ゴミ箱 |
| search_vector | tsvector | | 全文検索用 |

### tags

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| name | text | UNIQUE, NOT NULL | タグ名 |
| color | text | NOT NULL, default 'default' | タグ色 |
| created_at | timestamptz | NOT NULL, default now() | |

### recipe_tags

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| recipe_id | uuid | PK, FK → recipes.id ON DELETE CASCADE | |
| tag_id | uuid | PK, FK → tags.id ON DELETE CASCADE | |

### recipe_images

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | uuid | PK | |
| recipe_id | uuid | FK → recipes.id ON DELETE CASCADE | |
| storage_path | text | NOT NULL | Supabase Storage パス |
| sort_order | int | NOT NULL, default 0 | アップロード順 |
| created_at | timestamptz | NOT NULL, default now() | |

## インデックス

```sql
-- 全文検索（pg_bigm）
CREATE INDEX recipes_search_idx ON recipes USING gin (search_vector);

-- 一覧・ソート
CREATE INDEX recipes_title_idx ON recipes (title) WHERE deleted_at IS NULL;
CREATE INDEX recipes_deleted_at_idx ON recipes (deleted_at);

-- タグ使用回数集計用
CREATE INDEX recipe_tags_tag_id_idx ON recipe_tags (tag_id);
```

## 全文検索（日本語）

PostgreSQL 標準の `to_tsvector` では日本語の形態素解析が不十分なため、**pg_bigm** 拡張を使用する。

```sql
-- 拡張有効化（Supabase Dashboard → Database → Extensions）
CREATE EXTENSION IF NOT EXISTS pg_bigm;

-- search_vector 更新トリガー
CREATE OR REPLACE FUNCTION recipes_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.ingredients, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.instructions, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.notes, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_search_vector_trigger
  BEFORE INSERT OR UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION recipes_search_vector_update();
```

検索クエリ例（pg_bigm LIKE 検索）:

```sql
SELECT * FROM recipes
WHERE deleted_at IS NULL
  AND (
    title LIKE '%' || :query || '%'
    OR ingredients LIKE '%' || :query || '%'
    OR instructions LIKE '%' || :query || '%'
    OR notes LIKE '%' || :query || '%'
  )
ORDER BY title;
```

> pg_bigm の `LIKE` 検索は部分一致かつインデックス利用可能。より高度な形態素解析が必要な場合は将来 Meilisearch 等への移行を検討。

## Storage

| バケット名 | 公開 | 説明 |
|-----------|------|------|
| recipe-images | private | レシピ画像 |

パス形式: `{recipe_id}/{image_id}.{ext}`

## カード色・タグ色（プリセット）

Google Keep 風の色プリセットを定数としてアプリ側で管理:

```
default, red, orange, yellow, green, teal, blue, dark-blue, purple, pink, brown, gray
```

## 初期データ

- admin ユーザー 1件（シードスクリプトまたは手動 INSERT）
