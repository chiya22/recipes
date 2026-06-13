/**
 * 環境変数アクセスの一元管理。
 * 値が未設定でも import 時には落とさず、実際に利用するクライアント生成時に検証する。
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が未設定です。.env.local を確認してください（Docs/SETUP.md 参照）。`,
    );
  }
  return value;
}

export const env = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseAnonKey() {
    return required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  },
  get supabaseServiceRoleKey() {
    return required(
      "SUPABASE_SERVICE_ROLE_KEY",
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  },
  get sessionSecret() {
    return required("SESSION_SECRET", process.env.SESSION_SECRET);
  },
  get resendApiKey() {
    return required("RESEND_API_KEY", process.env.RESEND_API_KEY);
  },
  get resendFromEmail() {
    return required("RESEND_FROM_EMAIL", process.env.RESEND_FROM_EMAIL);
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
} as const;
