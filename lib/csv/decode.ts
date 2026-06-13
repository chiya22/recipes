export type CsvEncoding = "utf-8" | "shift-jis";

const MAX_CSV_BYTES = 5 * 1024 * 1024; // 5MB

/** ArrayBuffer を指定エンコーディングの文字列にデコードする。 */
export function decodeCsvText(
  buffer: ArrayBuffer,
  encoding: CsvEncoding,
): string {
  if (buffer.byteLength > MAX_CSV_BYTES) {
    throw new Error("CSV ファイルは 5MB 以内にしてください");
  }

  const label = encoding === "shift-jis" ? "shift_jis" : "utf-8";
  let text = new TextDecoder(label).decode(buffer);

  // UTF-8 BOM を除去
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  return text;
}

export function isCsvEncoding(value: unknown): value is CsvEncoding {
  return value === "utf-8" || value === "shift-jis";
}
