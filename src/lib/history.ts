import { parse } from "csv-parse/sync";

// ラジオポトフ年表スプレッドシート(タブ名「ポトフ年表」)。
// 列: 並び順 / (空欄) / 日付 / 本文 / リンク文言 / リンクURL / (結合列、未使用)
const HISTORY_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=335985056";

export type HistoryEntry = {
  order: number;
  date: string;
  body: string;
  linkText?: string;
  linkUrl?: string;
};

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch(HISTORY_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const entries = rows
      .slice(1)
      .filter((row) => row[2]?.trim() && row[3]?.trim())
      .map((row) => ({
        order: Number(row[0]) || 0,
        date: row[2].trim(),
        body: row[3].trim(),
        linkText: row[4]?.trim() || undefined,
        linkUrl: row[5]?.trim() || undefined,
      }));
    return entries.sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}
