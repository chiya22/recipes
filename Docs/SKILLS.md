# 推奨 Skills

開発効率向上のため、以下の Cursor Skills の導入を推奨する。

---

## Supabase Agent Skills（最優先）

Supabase のスキーマ設計、RLS、マイグレーション、Storage、セキュリティベストプラクティスを参照できる。

### インストール

```bash
npx skills add supabase/agent-skills
```

### 用途

- テーブル設計・マイグレーション作成
- RLS ポリシー設計
- Storage バケット設定
- セキュリティ監査（`get_advisors` 等）

---

## Cursor 同梱 Skills

以下は Cursor に既に含まれている。

| Skill | 用途 | パス |
|-------|------|------|
| create-rule | プロジェクト固有のコーディング規約を `.cursor/rules/` に定義 | `~/.cursor/skills-cursor/create-rule/` |
| create-skill | レシピアプリ専用 Skill を自作 | `~/.cursor/skills-cursor/create-skill/` |

### create-rule の活用例

プロジェクト開始時に以下のルールを作成するとよい:

- Next.js App Router の Server/Client Component 使い分け
- Supabase クライアントの server/browser 分離
- 日本語 UI テキスト規約
- Google Keep 風 UI のコンポーネント命名

---

## MCP サーバー

Cursor に Supabase MCP サーバーが接続済みの場合、以下が可能:

- `list_tables` — スキーマ確認
- `apply_migration` — マイグレーション適用
- `get_logs` — デバッグ
- `get_advisors` — セキュリティ・パフォーマンス監査

---

## 参考リンク

- [Supabase AI Skills 公式ガイド](https://supabase.com/docs/guides/getting-started/ai-skills)
- [Supabase ローカル開発](https://supabase.com/docs/guides/local-development)（本プロジェクトでは未使用）
- [Resend + Next.js](https://resend.com/docs/send-with-nextjs)
- [pg_bigm 拡張](https://github.com/pgbigm/pg_bigm)
