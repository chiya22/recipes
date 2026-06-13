import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * ブラウザ用の Supabase クライアント（anon キー）。
 *
 * 主に Storage の署名付き URL 経由の画像表示など、クライアント側で
 * Supabase に直接アクセスする必要がある場合に使用する。
 * 認証はカスタム実装のため Supabase Auth のセッションは扱わない。
 */
let cached: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  if (cached) return cached;
  cached = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
