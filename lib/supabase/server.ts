import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * サーバー専用の Supabase クライアント。
 *
 * 本アプリは Supabase Auth を使わずカスタム認証を採用しているため、
 * サーバー側では service_role キーで DB / Storage を操作する（RLS をバイパス）。
 * 認可（ロールチェック等）はアプリケーション層で行う。
 *
 * service_role キーは絶対にクライアントへ漏らさないこと。
 */
let cached: SupabaseClient<Database> | null = null;

export function createServerSupabaseClient(): SupabaseClient<Database> {
  if (cached) return cached;
  cached = createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
