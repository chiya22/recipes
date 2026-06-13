# 開発環境セットアップ

## 前提

- Node.js 20+
- npm
- Supabase アカウント
- Resend アカウント
- Vercel アカウント（デプロイ時）

---

## 1. リポジトリ

```bash
git clone <repo-url>
cd recipes
npm install
```

## 2. Supabase プロジェクト

1. [Supabase Dashboard](https://supabase.com/dashboard) で新規プロジェクト作成
2. **Settings → API** から以下を取得:
   - Project URL
   - anon public key
   - service_role key（サーバー側のみ使用）

3. **Database → Extensions** で `pgroonga` を有効化（日本語全文検索用。`pg_bigm` は当環境で利用不可のため PGroonga を採用）

4. **Storage** で `recipe-images` バケットを作成（private）

5. マイグレーションを適用（`supabase/migrations/*.sql` の順）:
   - 方法A: Supabase CLI（`supabase db push`）
   - 方法B: SQL Editor で各ファイルを順に実行
   - 含まれるもの: `users` / `recipes`・`tags`・`recipe_tags`・`recipe_images`（+ PGroonga インデックス）/ Storage バケット / 全文検索 RPC `search_recipe_ids`

## 3. Resend

1. [Resend](https://resend.com) でアカウント作成
2. ドメイン認証（または開発時は `onboarding@resend.dev` を使用）
3. API Key を取得

## 4. 環境変数

`.env.local` を作成:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Auth
SESSION_SECRET=<random-32-chars-minimum>

# Resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=Recipes <noreply@yourdomain.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 5. 初期 admin ユーザー

パスワードの bcrypt ハッシュを生成:

```bash
node scripts/hash-password.mjs "your-password"
```

Supabase SQL Editor で実行（出力されたハッシュに置換）:

```sql
INSERT INTO users (login_id, name, role, password_hash, email)
VALUES (
  'admin',
  '管理者',
  'admin',
  '$2b$10$...',  -- 上で生成した bcrypt ハッシュ
  'admin@example.com'  -- 通知を受け取るには email 必須
);
```

> admin の email を設定しないとレシピ変更通知メールは届きません（送信対象は email 設定済みの admin のみ）。

## 6. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

---

## デプロイ（Vercel）

詳細な手順とチェックリストは `Docs/DEPLOY.md` を参照。

---

## 依存パッケージ

すべて `package.json` に定義済み（`npm install` で導入）:

- ランタイム: `@supabase/supabase-js` / `bcryptjs` / `jose` / `resend` / `server-only` / `next` / `react`
- Masonry は CSS multi-column による自前実装のため追加ライブラリ不要
- `bcryptjs` は型定義を同梱するため `@types/bcryptjs` は不要
