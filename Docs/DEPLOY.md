# デプロイ手順（Vercel）

本アプリは Vercel へのデプロイを想定。Supabase（DB / Storage）と Resend は
既存のプロジェクト / アカウントを本番用に利用する。

---

## 前提

- GitHub などにリポジトリを push 済み
- Supabase プロジェクト（マイグレーション適用済み・`recipe-images` バケット作成済み）
- Resend アカウント（**独自ドメインを認証済み**＝任意の宛先へ送信可能）
- Vercel アカウント

---

## 1. Vercel プロジェクト作成

1. Vercel Dashboard → **Add New… → Project**
2. リポジトリをインポート
3. Framework Preset: **Next.js**（自動検出）
4. Build Command / Output: デフォルトのまま（`next build`）
5. Node.js Version: **20.x**（`.nvmrc` / `package.json` の `engines` に準拠）

## 2. 環境変数（Production）

Vercel → **Settings → Environment Variables** に以下を設定（`.env.example` 準拠）。

| 変数 | 例 / 備考 | 公開範囲 |
|------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key（**秘匿**） | Server のみ |
| `SESSION_SECRET` | 32 文字以上のランダム文字列（本番は新規生成推奨） | Server のみ |
| `RESEND_API_KEY` | `re_...`（**秘匿**） | Server のみ |
| `RESEND_FROM_EMAIL` | `Recipes <noreply@yourdomain.com>`（認証済みドメイン） | Server のみ |
| `NEXT_PUBLIC_APP_URL` | **本番 URL**（例 `https://recipes.example.com`） | Public |

> `NEXT_PUBLIC_*` 以外はブラウザに露出しない。`SUPABASE_SERVICE_ROLE_KEY` は
> 絶対に公開しないこと（RLS をバイパスする全権キー）。

## 3. デプロイ

1. **Deploy** を実行
2. 完了後、本番 URL にアクセスして `/login` が表示されることを確認

## 4. 本番初期設定

- 初期 admin を未作成なら作成（`Docs/SETUP.md` 手順 5）
- 既存の一時パスワード（`changeme123` など）を**必ず変更**（`/admin/users` から）
- 通知を受け取る admin に **email を設定**（未設定だと通知は飛ばない）

---

## デプロイ前チェックリスト

- [ ] `npm run lint` がパス
- [ ] `npm run typecheck` がパス
- [ ] `npm run build` がローカルでパス
- [ ] `.env.local` がコミットされていない（`.gitignore` 済み）
- [ ] Supabase マイグレーションが本番 DB に適用済み
- [ ] `recipe-images` バケット作成済み（private）
- [ ] PGroonga 拡張が有効
- [ ] `search_recipe_ids` 関数が存在
- [ ] Vercel に全環境変数を設定
- [ ] `NEXT_PUBLIC_APP_URL` を本番 URL に設定
- [ ] `SESSION_SECRET` を本番用に設定（強度十分）
- [ ] Resend ドメイン認証済み（`RESEND_FROM_EMAIL` のドメイン）
- [ ] 初期 admin の一時パスワードを変更
- [ ] admin に email を設定（通知用）

---

## デプロイ後の動作確認

- [ ] `/login` でログインできる
- [ ] レシピの作成・編集・削除ができる
- [ ] 画像アップロード・表示ができる
- [ ] タグ絞り込み・全文検索が動く
- [ ] ゴミ箱の復元・完全削除が動く
- [ ] `/admin/users`・`/admin/tags`（admin のみ）にアクセスできる
- [ ] 一般ユーザーで `/admin/*` が `/` にリダイレクトされる
- [ ] レシピ変更時に admin へメールが届く

---

## 注意・既知事項

- **PGroonga**: Supabase の拡張一覧に `pgroonga` が必要。本番プロジェクトでも有効化すること。
- **Cookie**: セッション Cookie は本番（`NODE_ENV=production`）で `Secure` 属性が付くため、**HTTPS 必須**（Vercel は標準で HTTPS）。
- **画像 URL**: `next.config.ts` の `images.remotePatterns` が `*.supabase.co` を許可済み。
- **メール送信**: Resend のフリープランは送信上限あり。宛先が認証済みドメイン外だと送れないため、独自ドメイン認証を推奨。
