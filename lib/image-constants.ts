/**
 * 画像アップロードの制限値（クライアント・サーバー共有）。
 * server-only に依存しないため、クライアントコンポーネントから安全に import できる。
 */
export const IMAGE_MAX_COUNT = 10;
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const IMAGE_ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
