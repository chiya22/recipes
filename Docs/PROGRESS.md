# 開発進捗管理

最終更新: 2026-06-13

## フェーズ概要

| フェーズ | 内容 | 状態 |
|----------|------|------|
| 0 | 要件定義 | ✅ 完了 |
| 1 | プロジェクト基盤・Supabase セットアップ | ✅ 完了 |
| 2 | 認証 | ✅ 完了 |
| 3 | DB スキーマ・マイグレーション | ✅ 完了 |
| 4 | レシピ CRUD（API + UI） | ✅ 完了 |
| 5 | タグ機能 | ✅ 完了 |
| 6 | 検索・絞り込み | ✅ 完了 |
| 7 | 画像アップロード | ✅ 完了 |
| 8 | メール通知 | ✅ 完了 |
| 9 | 管理画面（ユーザー・タグ） | ✅ 完了 |
| 10 | UI 仕上げ・レスポンシブ | ✅ 完了 |
| 11 | デプロイ | ✅ 準備完了（実デプロイは要 Vercel 連携） |

---

## タスク詳細

### フェーズ 1: プロジェクト基盤

- [x] Supabase プロジェクト作成（接続済み: `https://sheywnstatbyumfmdkzt.supabase.co`、`.env.local` 設定済み）
- [x] 環境変数設定（`.env.local` / `.env.example` テンプレート作成。値はユーザーが記入）
- [x] Supabase クライアント設定（`lib/supabase/server.ts` / `client.ts`、`lib/env.ts`）
- [x] Resend 設定（`lib/email/resend.ts` 実装済み。`.env.local` にキー設定済み）
- [x] 共通レイアウト・Keep 風 UI 基盤（Tailwind テーマ: `globals.css` / `layout.tsx` / `lib/colors.ts`）
- [x] Masonry Layout コンポーネント（`components/layout/Masonry.tsx`、CSS columns ベース・依存なし）

### フェーズ 2: 認証

- [x] users テーブル作成（`supabase/migrations/20260613090000_users.sql`。Supabase MCP で適用済み・RLS 有効）
- [x] パスワードハッシュ（bcryptjs。`lib/auth/password.ts` + `scripts/hash-password.mjs`）
- [x] ログイン API（Route Handler。`app/api/auth/{login,logout,me}/route.ts`）
- [x] セッション管理（Cookie + JWT。`lib/auth/session.ts`、jose / HS256 / HttpOnly）
- [x] 認証ミドルウェア（Next 16 では `proxy.ts`。楽観的チェック + DAL による多層防御）
- [x] ログイン画面（`app/(auth)/login/`、ログアウトボタン `components/auth/LogoutButton.tsx`）

### フェーズ 3: DB スキーマ

- [x] recipes テーブル（FK: created_by/updated_by → users、論理削除 deleted_at、updated_at トリガー）
- [x] tags テーブル
- [x] recipe_tags 中間テーブル（複合 PK）
- [x] recipe_images テーブル
- [x] 全文検索用インデックス（**PGroonga** を採用。pg_bigm は当環境で利用不可）
- [x] RLS（全テーブル有効化。anon/authenticated 全拒否、サーバーは service_role）
- [x] Storage バケット（recipe-images, private）
- [x] DB 型生成（`types/database.ts`、Supabase クライアントに適用）

### フェーズ 4: レシピ CRUD

- [x] レシピ一覧取得（`lib/recipes.ts` listActiveRecipes、FK エイリアス付きネスト select + タグ/画像結合 + 署名 URL）
- [x] レシピ作成（Server Action `createRecipeAction` + タグ自動作成・同期）
- [x] レシピ更新（`updateRecipeAction`）
- [x] レシピ論理削除（`deleteRecipeAction`）
- [x] ゴミ箱一覧・復元・完全削除（`listDeletedRecipes` / `restoreRecipeAction` / `permanentDeleteRecipeAction`、完全削除時は Storage 画像も除去）
- [x] レシピカードコンポーネント（`RecipeCard`、色分け・サムネ・タグ）
- [x] インライン作成・編集フォーム（`InlineCreateForm` / `RecipeForm`、Keep 風展開）
- [x] 詳細モーダル（`RecipeModal`、表示↔編集切替、アクセシブル `Modal`）
- [x] 色分け UI（`ColorPicker` + `lib/colors`）

### フェーズ 5: タグ機能

- [x] タグ CRUD API（`lib/tags.ts` + `app/actions/tags.ts`。更新/削除/統合は admin 限定）
- [x] レシピへのタグ付与（フェーズ 4 の name ベース upsert を継続利用）
- [x] タグ候補サジェスト（`TagInput` の datalist。既存タグ名を `listTagNames` から供給）
- [x] 左サイドバー（`components/layout/Sidebar.tsx`。使用回数順・色ドット・件数表示）
- [x] タグ絞り込み（AND 条件。`recipeIdsWithAllTags` で交差を計算し `listActiveRecipes({tagIds})` に適用、URL `?tags=` で状態保持）
- [x] タグ色 UI（サイドバーで色ドット表示。色変更は admin タグ管理画面=フェーズ 9 で UI 提供）

### フェーズ 6: 検索

- [x] 日本語全文検索（**PGroonga** RPC `search_recipe_ids`。title/材料/作り方/メモ + タグ名を対象に OR 検索）
- [x] 検索バー UI（`components/layout/SearchBar.tsx`。デバウンス 300ms で URL `?q=` を更新、tags 維持）
- [x] 検索 + タグ絞り込みの組み合わせ（ID 集合の交差で AND 合成、`listActiveRecipes({tagIds, query})`）
- [x] タイトル順ソート（`order by title`）

### フェーズ 7: 画像

- [x] Supabase Storage アップロード（`addRecipeImage`。service_role で upload + 署名 URL。パス `{recipe_id}/{image_id}.{ext}`）
- [x] 複数画像対応（最大 10 枚・5MB・JPEG/PNG/WebP を `lib/image-constants.ts` で制限。`ImageUploader` で複数選択）
- [x] サムネイル生成・表示（`ImageUploader` のサムネイル + `RecipeCard`/`RecipeModal` の画像表示。新規作成時は未保存プレビュー）
- [x] 画像削除（`deleteRecipeImage`。Storage + DB から削除。`deleteRecipeImageAction`）

### フェーズ 8: メール通知

- [x] Resend 連携（`lib/email/resend.ts` を利用。疎通確認済み）
- [x] レシピ CRUD 時の通知トリガー（作成/更新/論理削除のアクション成功後に通知）
- [x] admin 全員への送信ロジック（`listAdminEmails` で email 設定済み admin を抽出。操作者本人は除外）
- [x] メールテンプレート（`lib/email/notifications.ts`。HTML エスケープ + 操作別の件名/本文/リンク）

### フェーズ 9: 管理画面

- [x] ユーザー管理画面（admin のみ。`/admin/users`。一覧・作成・編集（名前/ロール/メール/パスワード再設定）・削除）
- [x] タグ管理画面（admin のみ。`/admin/tags`。名前・色編集・削除・統合。フェーズ 5 の actions を利用）
- [x] アクセス制御（`app/admin/layout.tsx` で `requireRole('admin')`。非 admin は `/` へリダイレクト）
- [x] AppHeader に「管理」リンク（admin のみ表示）

### フェーズ 10: UI 仕上げ

- [x] Google Keep 風デザイン調整（ヘッダーのレスポンシブ間隔・ユーザー名は lg 以上で表示・viewport/themeColor 設定）
- [x] モバイルレスポンシブ（ハンバーガーメニュー）（`MobileSidebar` ドロワー。Sidebar を `SidebarContent` に分離して PC/モバイル共用）
- [x] アクセシビリティ基本対応（`Spinner` の role=status、ドロワーの role=dialog/aria-modal・Esc 閉じ、フォーカスリングは既存）
- [x] エラー・ローディング状態（`app/loading.tsx` / `app/error.tsx` / `app/not-found.tsx`、検索バーに pending スピナー）

### フェーズ 11: デプロイ

- [x] Vercel プロジェクト設定（手順を `Docs/DEPLOY.md` に整備。`.nvmrc`=20 / `package.json` engines 追加）
- [x] 環境変数（本番）（`Docs/DEPLOY.md` に一覧化。公開/秘匿の区別を明記）
- [x] 動作確認（本番ビルド + `next start` で実認証スモーク: home 200 / login 200。typecheck/lint/build グリーン）
- [ ] 実デプロイ（**要ユーザー操作**: Vercel アカウント連携・GitHub 接続・環境変数設定が必要）

---

## ブロッカー・メモ

### フェーズ 11（2026-06-13）

- **成果物**: `Docs/DEPLOY.md`（Vercel 手順 + デプロイ前後チェックリスト）、`README.md`（プロジェクト概要に刷新）、`Docs/SETUP.md` の不整合修正（pg_bigm→PGroonga、マイグレーションは `supabase/migrations/*`、react-masonry-css/@types/bcryptjs 不要）。
- **設定**: `package.json` に `engines.node>=20` と `typecheck`（`tsc --noEmit`）追加、`.nvmrc`=20。
- **本番適性の確認**: セッション Cookie は本番で `Secure`（HTTPS 前提）、`next.config.ts` の画像 remotePatterns は `*.supabase.co` 許可済み。
- **動作確認済み**: `npm run typecheck`/`lint`/`build` グリーン。`NODE_ENV=production` で `next start` 起動 → 認証後 `/` 200・`/login` 200 を確認。
- **要ユーザー操作（未完）**: 実際の Vercel デプロイ（GitHub 接続・環境変数登録・本番 `NEXT_PUBLIC_APP_URL`/`SESSION_SECRET` 設定・初期 admin パスワード変更・admin email 設定）。手順は `Docs/DEPLOY.md` 参照。

### フェーズ 10（2026-06-13）

- **レスポンシブ**: サイドバーは `Sidebar`（`hidden md:block`）と `MobileSidebar`（`md:hidden` のドロワー）に分割。共通の `SidebarContent` を両者で再利用（タグ選択は URL `?tags=` 連携を共有フック化）。ドロワーは Esc・背景クリック・項目選択で閉じ、開いている間は body スクロール抑止。
- **ローディング/エラー**: ルートセグメントに `loading.tsx`（中央スピナー）/ `error.tsx`（再試行ボタン付きエラーバウンダリ）/ `not-found.tsx`（404）を追加。検索バーは `useTransition` の pending 中にスピナー表示。
- **a11y/デザイン**: `Spinner`（role=status）を追加。ヘッダーは小画面で余白圧縮・ユーザー名は lg 以上で表示。`viewport`（device-width / themeColor）を設定。
- **動作確認済み**: 開発サーバーで実認証フローを確認（login 200、未認証 `/`→307、認証後 `/` 200・`/trash` 200・`/admin/users` 200・`/admin/tags` 200）。ビルド・lint グリーン。

### フェーズ 9（2026-06-13）

- **アクセス制御**: `/admin` 配下は `app/admin/layout.tsx` の `requireRole('admin')` で保護（非 admin は `/` リダイレクト）。Server Actions 側でも `requireAdmin` で二重防御。
- **ユーザー管理**: `lib/users.ts` に CRUD（`listUsers/createUser/updateUser/deleteUser/countAdmins`）。パスワードは bcrypt（既存 `hashPassword`）。`login_id` 一意制約・8文字以上パスワード・メール形式・ログインID 文字種を検証。
- **ロックアウト防止ガード**: 「最後の admin の降格/削除を禁止」「自分自身の権限変更・自分自身の削除を禁止」。
- **タグ管理**: フェーズ 5 の `updateTagAction/deleteTagAction/mergeTagAction`（admin 限定）を UI 化。色は既存 `ColorPicker` を再利用。統合は対象タグ選択式。
- **設計判断（API.md からの逸脱）**: ユーザー/タグ管理も Route Handler ではなく Server Actions で実装（アプリ全体の一貫性）。
- **動作確認済み**: ユーザー CRUD のデータ経路を実 DB で検証（作成 OK / 重複 login_id 拒否=23505 / 更新 OK / bcrypt 照合 true / 削除 OK）。検証スクリプトは削除済み。ビルド・lint グリーン（`/admin/users`・`/admin/tags` ルート生成を確認）。

### フェーズ 8（2026-06-13）

- **設計判断**: 通知は `lib/email/notifications.ts` の `notifyRecipeChange({action, recipe, actor})` に集約。レシピ作成/更新/削除のアクション成功後に `await` で送信（失敗は内部で握りつぶし、CRUD 本体は妨げない）。
- **設計判断**: 送信対象は `role='admin'` かつ email 設定済みのユーザー。**操作者本人は除外**（自分の操作で自分に届くノイズを防止）。宛先 0 件なら no-op。
- **設計判断**: 削除通知はタイトルが必要なため、論理削除の**前に** `getRecipeById` で取得してから通知。本文のリンクは削除時のみ `/trash`、それ以外は `/`。
- セキュリティ: 件名/本文に入るレシピ名・操作者名は HTML エスケープ。
- **現状の注意**: 既存 admin（`login_id=admin`）は **email 未設定**（admins=1, with_email=0）のため、現時点では実際の宛先が 0 で通知は飛ばない。ユーザー管理画面（フェーズ 9）で email を設定すれば届く。
- **動作確認済み**: Resend 送信疎通を実 API で確認（送信元アドレス宛にテスト送信 → `data.id` 返却・`error: null`）。検証スクリプトは削除済み。ビルド・lint グリーン。

### フェーズ 7（2026-06-13）

- **設計判断（API.md からの逸脱）**: 画像アップロードは API.md では Route Handler 想定だが、他機能と一貫させ **Server Actions**（`app/actions/images.ts`）で実装。`uploadRecipeImageAction(recipeId, FormData)` / `deleteRecipeImageAction(imageId)`。
- **設計判断（作成時の画像）**: recipe_images は recipe_id FK 必須のため、新規作成では画像を **保留（File 配列）→ レシピ作成後に順次アップロード**（`InlineCreateForm`）。編集（`RecipeModal`）では recipeId が確定しているため **即時アップロード/削除**。
- **server-only 分離の落とし穴**: クライアントの `ImageUploader` が制限定数を `lib/recipes.ts`（server-only）から import するとクライアントバンドルに server-only が混入しビルド失敗。定数を `lib/image-constants.ts` に分離して解決。
- **lint**: object URL プレビューは `useEffect` 内 setState 禁止ルールに抵触するため `useState(() => createObjectURL)` + cleanup で revoke。
- 制限: 1 レシピ 10 枚 / 5MB / JPEG・PNG・WebP（アプリ層で検証。DB 失敗時は Storage の孤児ファイルを後始末）。
- **動作確認済み**: service_role 経由で upload→recipe_images insert→署名 URL fetch(200, image/png)→Storage/DB 削除までを実データで検証（検証データ・スクリプトは削除済み）。ビルド・lint グリーン。

### フェーズ 6（2026-06-13）

- **設計判断**: PGroonga の `&@` / `&@~` 演算子は PostgREST のクエリビルダから使えないため、一致する `recipe.id` を返す RPC `search_recipe_ids(q text)` を作成（`supabase/migrations/20260613110000_search_recipe_ids.sql`）。アプリは `.rpc()` で呼び id 絞り込みに利用し、既存のネスト select + 署名 URL パイプラインを再利用。
- **演算子の選定**: `&@` は隣接フレーズ一致（複数語が連続しないとヒットしない）と判明。複数語 AND を実現するため `&@~`（Groonga クエリ構文・空白区切りで AND）を採用。
- **セキュリティ**: `&@~` は `( ) " OR - *` 等を演算子解釈しエラーになり得るため、アプリ側（`lib/search.ts` `toGroongaQuery`）で空白分割→各トークンをダブルクォート化（`"玉ねぎ" "牛肉"`）して演算子を無効化。RPC は `set search_path = ''` + 演算子を `operator(public.&@~)` でスキーマ修飾。
- **設計判断**: 検索とタグ AND 絞り込みは ID 集合の交差で合成（両方指定時は両条件を満たすもののみ）。
- 検索バーはヘッダーに常設（ホームのみ表示）。デバウンス 300ms、戻る/進む・サイドバー操作との同期、クリアボタン対応。`useSearchParams` を利用（ホームは動的レンダリング）。
- **動作確認済み（SQL）**: 「玉ねぎ」→材料一致2件、「カレー」→タイトル一致、`"玉ねぎ" "牛肉"`→AND で2件、`"(トマト"`→特殊文字でもエラーなし0件。ビルド・lint グリーン。検証データは削除済み。

### フェーズ 5（2026-06-13）

- **設計判断**: タグ AND 絞り込みは PostgREST で HAVING を直接書けないため、`recipe_tags` を選択タグで取得しアプリ層で交差集合を算出（`lib/tags.ts` `recipeIdsWithAllTags`）。新規 RPC を作らず実装。
- **設計判断**: タグ更新/削除/統合の Server Action（`app/actions/tags.ts`）は `requireUser()` + role 判定で **admin 限定**。実際の管理 UI はフェーズ 9 で用意。
- **設計判断**: 統合（merge）は source の `recipe_tags` を target へ付け替え（重複は除外）後に source タグを削除（紐付けは CASCADE）。
- 候補サジェストはネイティブ `<datalist>` を採用（依存追加なし・アクセシブル）。付与済みタグは候補から除外。
- フィルタ状態は URL `?tags=id1,id2`（サーバーコンポーネントが読み取り、存在しない ID は除外）。サイドバーはクリックで `router.push`。サイドバーは `md` 以上で表示（モバイル対応はフェーズ 10）。
- **動作確認済み**: AND 絞り込みの結果集合を SQL で検証（tagA∧tagB → 1件、tagA単体 → 2件）。ビルド・lint グリーン。検証データは削除済み。

### フェーズ 4（2026-06-13）

- **設計判断**: CRUD は API.md 方針どおり Server Actions（`app/actions/recipes.ts`）で実装。各アクションは `requireUser()` で認証必須化し `revalidatePath` で再検証。
- **設計判断**: タグはレシピ作成/更新時に名前ベースで自動 upsert + `recipe_tags` 同期（タグ専用 UI/API はフェーズ 5）。
- **型の落とし穴**: `types/database.ts` の `Functions` を `Record<string,unknown>` にすると Supabase のスキーマ型制約を満たさず insert/upsert が `never` 化する。`{ [_ in never]: never }` 形式に修正して解決。
- `next.config.ts` に Supabase Storage（`*.supabase.co`）の画像 remotePatterns を追加。
- **動作確認済み**: 認証後ホーム(200)でレシピ名・結合タグが描画、ゴミ箱(200)。読み取りパス（FK エイリアス埋め込み select）を実サーバーで検証。検証データは削除済み。
- 検索バーはヘッダーにプレースホルダー設置のみ（実装フェーズ 6）。タグサイドバー未実装（フェーズ 5）。

### フェーズ 3（2026-06-13）

- **重要な設計変更**: 設計書（Docs/DATABASE.md）が指定する **pg_bigm は当 Supabase プロジェクトで利用不可**。日本語全文検索は Supabase 公式サポートの **PGroonga** を採用。
  - recipes の title/ingredients/instructions/notes に PGroonga インデックスを作成。検索は `&@`（部分一致）/ `&@~`（クエリ）演算子を使用（フェーズ 6 で実装）。
  - 設計書の `search_vector`(tsvector) 列は廃止（`to_tsvector('simple')` は日本語に不適なため）。
- **動作確認済み**: 日本語の部分一致検索（「カレー」「にんじん」「定番」）がインデックス経由でヒット、無関係語は 0 件。
- スキーマ適用（Supabase MCP）: recipes / tags / recipe_tags / recipe_images + 各インデックス + RLS。
- Storage バケット `recipe-images`（private）作成。アップロード/署名 URL はサーバー(service_role)で行うため storage ポリシーは未作成（デフォルト拒否）。
- security advisor: WARN `extension_in_public`（pgroonga）は **pgroonga が SET SCHEMA 非対応**のため public のまま（PGroonga 利用時の許容事項）。INFO `rls_enabled_no_policy` は設計通り。
- `types/database.ts` を生成し、`lib/supabase/{server,client}.ts` を `createClient<Database>` で型付け。
- ビルド・lint グリーン。

### フェーズ 1（2026-06-13）

- **要ユーザー操作**: 以下はアカウント/シークレットが必要なため未完。`.env.local` に値を記入すれば動作する。
  - Supabase プロジェクト作成 → `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
  - Resend API キー取得 → `RESEND_API_KEY` / `RESEND_FROM_EMAIL`
  - `SESSION_SECRET`（32文字以上のランダム文字列）
- **設計判断**: 認証はカスタム実装のため、サーバー側 Supabase クライアントは service_role キーで RLS をバイパス。認可はアプリ層で実施。
- **設計判断**: Masonry は `react-masonry-css` を使わず CSS multi-column で自前実装（依存削減・React 19 互換）。
- 追加パッケージ: `@supabase/supabase-js`, `resend`, `server-only`。
- ビルド・lint ともにグリーン（`npm run build` / `npm run lint`）。

### フェーズ 2（2026-06-13）

- **設計判断**: セッションはステートレス JWT（jose / HS256）を HttpOnly Cookie に保存。`SESSION_SECRET` で署名するため、ペイロード（userId/loginId/name/role）は信頼可能（Supabase の user_metadata と異なりユーザー編集不可）。
- **設計判断**: Next.js 16 で middleware が `proxy.ts` に改称（Node ランタイム）。proxy は Cookie 署名検証のみの楽観的チェックに留め、本番の認可は DAL（`lib/auth/dal.ts`）/ Route Handler 側で実施（多層防御）。
- **設計判断**: ログインのタイミング攻撃対策として、ユーザー不在時もダミーハッシュで bcrypt 比較を実行。
- 追加パッケージ: `jose`, `bcryptjs`。
- **DB 適用済み（Supabase MCP）**:
  - `users` テーブル + `set_updated_at` トリガー（`search_path = ''` で hardening 済み）+ RLS 有効化。
  - security advisor: WARN（function search_path）は解消。残る INFO `rls_enabled_no_policy` は設計通り（anon/authenticated 全拒否・サーバーは service_role）。
  - 初期 admin 作成済み: `login_id=admin` / 一時パスワード `changeme123`（**要変更**）/ role=admin。
- **動作確認済み**: ログイン成功(200)・セッション `/api/auth/me`(200)・誤パスワード(401) を実サーバーで検証。
- ⚠ admin の一時パスワードは早めに変更すること（ユーザー管理画面はフェーズ 9）。
