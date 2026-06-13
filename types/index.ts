/**
 * アプリ全体で共有する型定義。
 * API 設計は Docs/API.md を参照。
 */

export type Role = "admin" | "user";

export type User = {
  id: string;
  loginId: string;
  name: string;
  role: Role;
  email?: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type TagWithCount = Tag & { count: number };

export type RecipeImage = {
  id: string;
  storagePath: string;
  url: string; // 署名付き URL
  sortOrder: number;
};

export type Recipe = {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  notes: string;
  tags: Tag[];
  images: RecipeImage[];
  createdBy: Pick<User, "id" | "name">;
  updatedBy: Pick<User, "id" | "name">;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

export type ApiError = {
  error: string;
  code?: string;
};
