/**
 * ユーザー入力を PGroonga（Groonga）クエリ構文へ安全に変換する。
 *
 * Groonga クエリ構文は `( ) " OR - + < > ~ *` などを演算子として解釈し、
 * 不正な構文ではエラーになる。そのため空白でトークン分割し、各トークンを
 * ダブルクォートで囲んだ「フレーズ」に変換することで演算子解釈を無効化する。
 * トークン同士は空白区切り（= AND）で結合する。
 *
 * 例: `玉ねぎ 牛肉` -> `"玉ねぎ" "牛肉"`（両方を含むものにヒット）
 */
export function toGroongaQuery(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const tokens = trimmed
    .split(/\s+/)
    .map((token) => token.replace(/\\/g, "\\\\").replace(/"/g, '\\"'))
    .filter((token) => token.length > 0)
    .map((token) => `"${token}"`);

  if (tokens.length === 0) return null;
  return tokens.join(" ");
}
