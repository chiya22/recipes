# レシピ

Google Keep 風 UI のレシピ管理アプリ。Next.js 16 + React 19 + Tailwind CSS 4 +
Supabase（DB / Storage）で構築。認証は Supabase Auth を使わないカスタム実装。

## 主な機能

- レシピの作成・編集・削除（ゴミ箱 / 復元 / 完全削除）
- タグ付け・タグ管理（使用回数順サイドバー、AND 絞り込み、統合）
- 日本語全文検索（PGroonga）
- 複数画像アップロード（Supabase Storage、署名付き URL）
- レシピ変更時の admin 向けメール通知（Resend）
- ユーザー / タグ管理画面（admin のみ）
- レスポンシブ UI（モバイルはタグ絞り込みドロワー）

## 技術スタック

| 領域 | 採用技術 |
|------|----------|
| フレームワーク | Next.js 16（App Router / Server Actions） |
| UI | React 19 / Tailwind CSS 4 |
| DB / Storage | Supabase（PostgreSQL + Storage） |
| 認証 | カスタム（JWT: `jose` / パスワード: `bcryptjs` / HttpOnly Cookie） |
| 全文検索 | PGroonga |
| メール | Resend |

## セットアップ

詳細は [`Docs/SETUP.md`](Docs/SETUP.md) を参照。

```bash
npm install
cp .env.example .env.local   # 値を記入
npm run dev
```

http://localhost:3000 でアクセス。

## スクリプト

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー（要 build） |
| `npm run lint` | ESLint |
| `npm run typecheck` | 型チェック（`tsc --noEmit`） |

## ドキュメント

- [`Docs/SETUP.md`](Docs/SETUP.md) — 環境構築
- [`Docs/ARCHITECTURE.md`](Docs/ARCHITECTURE.md) — 設計
- [`Docs/DATABASE.md`](Docs/DATABASE.md) — DB スキーマ
- [`Docs/API.md`](Docs/API.md) — API / Server Actions
- [`Docs/UI.md`](Docs/UI.md) — UI 設計
- [`Docs/DEPLOY.md`](Docs/DEPLOY.md) — デプロイ手順
- [`Docs/PROGRESS.md`](Docs/PROGRESS.md) — 開発進捗

## デプロイ

Vercel を想定。手順とチェックリストは [`Docs/DEPLOY.md`](Docs/DEPLOY.md) を参照。
