# API 設計

Server Actions と Route Handlers の混在方針:
- **Server Actions**: フォーム送信、CRUD（レシピ・タグ・ユーザー）
- **Route Handlers**: 認証（Cookie 操作）、画像アップロード

---

## 認証

### POST /api/auth/login

```typescript
// Request
{ loginId: string; password: string }

// Response 200
{ user: { id, loginId, name, role } }

// Response 401
{ error: "Invalid credentials" }
```

### POST /api/auth/logout

セッション Cookie を削除。

### GET /api/auth/me

現在のログインユーザー情報を返す。

---

## レシピ

### GET /api/recipes

```typescript
// Query
{
  q?: string;           // 検索キーワード
  tagIds?: string[];    // タグ ID（AND 条件）
  includeDeleted?: boolean; // ゴミ箱用
}

// Response
{ recipes: Recipe[] }
```

### POST /api/recipes

```typescript
// Request
{
  title: string;
  ingredients?: string;
  instructions?: string;
  notes?: string;
  color?: string;
  tagNames?: string[];  // タグ名（存在しなければ作成）
}

// Response 201
{ recipe: Recipe }

// Side effect: admin へメール通知
```

### PATCH /api/recipes/[id]

```typescript
// Request（部分更新）
{
  title?: string;
  ingredients?: string;
  instructions?: string;
  notes?: string;
  color?: string;
  tagNames?: string[];
}

// Side effect: admin へメール通知
```

### DELETE /api/recipes/[id]

論理削除（`deleted_at` を設定）。

```typescript
// Side effect: admin へメール通知
```

### POST /api/recipes/[id]/restore

ゴミ箱から復元（`deleted_at = NULL`）。

### DELETE /api/recipes/[id]/permanent

完全削除（ゴミ箱内のみ）。

---

## タグ

### GET /api/tags

```typescript
// Response
{ tags: TagWithCount[] }  // 使用回数付き、多い順
```

### PATCH /api/tags/[id]（admin のみ）

```typescript
{ name?: string; color?: string }
```

### DELETE /api/tags/[id]（admin のみ）

### POST /api/tags/[id]/merge（admin のみ）

```typescript
{ targetTagId: string }  // このタグに統合
```

---

## 画像

### POST /api/upload

```typescript
// Request: multipart/form-data
{ recipeId: string; file: File }

// Response 201
{ image: RecipeImage }

// 制限: 10枚/レシピ, 5MB, JPEG/PNG/WebP
```

### DELETE /api/upload/[imageId]

Storage と DB から削除。

---

## ユーザー（admin のみ）

### GET /api/users

### POST /api/users

```typescript
{
  loginId: string;
  name: string;
  role: 'admin' | 'user';
  password: string;
  email?: string;
}
```

### PATCH /api/users/[id]

### DELETE /api/users/[id]

---

## 型定義（共通）

```typescript
type Role = 'admin' | 'user';

type User = {
  id: string;
  loginId: string;
  name: string;
  role: Role;
  email?: string;
};

type Recipe = {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  notes: string;
  color: string;
  tags: Tag[];
  images: RecipeImage[];
  createdBy: Pick<User, 'id' | 'name'>;
  updatedBy: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

type TagWithCount = Tag & { count: number };

type RecipeImage = {
  id: string;
  storagePath: string;
  url: string;        // 署名付き URL
  sortOrder: number;
};
```

---

## エラーレスポンス

```typescript
{ error: string; code?: string }
```

| HTTP | 用途 |
|------|------|
| 400 | バリデーションエラー |
| 401 | 未認証 |
| 403 | 権限不足 |
| 404 | リソース不在 |
| 500 | サーバーエラー |
