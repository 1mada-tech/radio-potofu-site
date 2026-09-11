import { parse } from "csv-parse/sync";

// ラジオポトフ年表スプレッドシート(タブ名「公式：年表」)。
// 列: (空欄) / 年 / 月 / 日(任意) / 本文 / リンク文言 / リンクURL
const HISTORY_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=1488414072";

export type HistoryEntry = {
  date: string;
  body: string;
  linkText?: string;
  linkUrl?: string;
};

function formatDate(year: string, month: string, day: string): string {
  if (day) return `${year}年${month}月${day}日`;
  return `${year}年${month}月`;
}

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch(HISTORY_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const entries = rows
      .slice(1)
      .filter((row) => row[1]?.trim() && row[4]?.trim())
      .map((row) => {
        const linkText = row[5]?.trim() || undefined;
        const linkUrl = row[6]?.trim() || undefined;
        const hasValidUrl = linkUrl?.startsWith("http");
        return {
          date: formatDate(row[1].trim(), row[2]?.trim() ?? "", row[3]?.trim() ?? ""),
          body: row[4].trim(),
          linkText: hasValidUrl ? linkText : undefined,
          linkUrl: hasValidUrl ? linkUrl : undefined,
        };
      });
    return entries;
  } catch {
    return [];
  }
}
