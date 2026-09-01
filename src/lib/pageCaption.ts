import { parse } from "csv-parse/sync";

// 各ページ共通の「キャプション」列を持つスプレッドシートから、
// 最初に入力されているキャプション文を1つ取得する汎用関数。
export async function getSimpleCaption(csvUrl: string): Promise<string | null> {
  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const header = rows[0] ?? [];
    const captionIndex = header.findIndex((cell) => cell.trim() === "キャプション");
    if (captionIndex === -1) return null;

    const found = rows.slice(1).find((row) => row[captionIndex]?.trim());
    return found?.[captionIndex]?.trim() ?? null;
  } catch {
    return null;
  }
}
