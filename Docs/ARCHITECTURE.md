# アーキテクチャ設計

## システム構成

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Next.js     │────▶│  Supabase       │
│  (React)    │◀────│  (Vercel)    │◀────│  PostgreSQL     │
└─────────────┘     └──────┬───────┘     │  Storage        │
                           │             └─────────────────┘
                           ▼
                    ┌──────────────┐
                    │   Resend     │
                    │  (Email)     │
                    └──────────────┘
```

## ディレクトリ構成（想定）

```
recipes/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (main)/
│   │   ├── layout.tsx          # サイドバー + メイン
│   │   ├── page.tsx            # レシピ一覧（Masonry）
│   │   └── trash/
│   ├── (admin)/
│   │   ├── users/
│   │   └── tags/
│   ├── api/
│   │   ├── auth/
│   │   ├── recipes/
│   │   ├── tags/
│   │   └── upload/
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── layout/                 # Sidebar, Header, SearchBar
│   ├── recipe/                 # RecipeCard, RecipeForm, RecipeModal
│   ├── tag/                    # TagList, TagChip
│   └── ui/                     # Button, Input, Modal 等
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # ブラウザ用
│   │   └── server.ts           # サーバー用
│   ├── auth/
│   │   ├── session.ts
│   │   └── password.ts
│   ├── email/
│   │   └── resend.ts
│   └── search/
│       └── fulltext.ts
├── types/
│   └── index.ts
├── Docs/
└── Requirements.md
```

## 認証フロー

```
1. ユーザーが ID + パスワードを送信
2. Server Action / Route Handler が users テーブルを照合
3. bcrypt でパスワード検証
4. セッション Cookie を発行（HttpOnly, Secure, SameSite）
5. 以降のリクエストでミドルウェアがセッションを検証
```

- Supabase Auth は**使用しない**（カスタム認証）
- Supabase は DB + Storage のみ利用

## データフロー（レシピ作成）

```
1. ユーザーがインラインフォームで入力
2. Server Action が recipes テーブルに INSERT
3. タグ: tags に UPSERT → recipe_tags に INSERT
4. 画像: Supabase Storage にアップロード → recipe_images に INSERT
5. 全文検索用 tsvector を更新（トリガー）
6. Resend で admin 全員にメール通知
7. クライアントで一覧を revalidate
```

## レンダリング戦略

| 画面 | 方式 |
|------|------|
| レシピ一覧 | Server Component + Client（Masonry, 検索） |
| レシピ詳細モーダル | Client Component |
| インライン作成・編集 | Client Component |
| 管理画面 | Server Component + Server Actions |
| ログイン | Client Component + Server Action |

## セキュリティ

- パスワード: bcrypt（cost factor 10〜12）
- セッション Cookie: HttpOnly, Secure（本番）, SameSite=Lax
- API: セッション検証 + ロールチェック
- Storage: 認証済みユーザーのみアップロード可
- SQL インジェクション: Supabase クライアントのパラメータバインド
