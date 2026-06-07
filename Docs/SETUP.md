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

3. **Database → Extensions** で `pg_bigm` を有効化

4. **Storage** で `recipe-images` バケットを作成（private）

5. SQL Editor で `Docs/DATABASE.md` のマイグレーションを実行

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

Supabase SQL Editor で実行（パスワードは bcrypt ハッシュに置換）:

```sql
INSERT INTO users (login_id, name, role, password_hash, email)
VALUES (
  'admin',
  '管理者',
  'admin',
  '$2b$10$...',  -- bcrypt hash of your password
  'admin@example.com'
);
```

## 6. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス。

---

## デプロイ（Vercel）

1. GitHub リポジトリを Vercel に接続
2. 環境変数を Vercel ダッシュボードに設定（`.env.local` と同内容）
3. `NEXT_PUBLIC_APP_URL` を本番 URL に変更
4. デプロイ

---

## 依存パッケージ（追加予定）

```bash
npm install @supabase/supabase-js bcryptjs resend
npm install -D @types/bcryptjs
```

Masonry Layout:

```bash
npm install react-masonry-css
```
