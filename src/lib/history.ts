import { parse } from "csv-parse/sync";

// ラジオポトフ年表スプレッドシート(タブ名「公式：年表」)。
// 列: (空欄) / 年 / 月 / 日(任意) / 本文 / リンク文言 / リンクURL
// リンク文言・リンクURLは、1つのセル内で改行区切りにすると複数リンクを
// 順番に並べられる(文言とURLは行番号で対応させる)。
const HISTORY_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=1488414072";

export type HistoryLink = {
  text: string;
  url: string;
};

export type HistoryEntry = {
  year: string;
  monthDay: string;
  body: string;
  links: HistoryLink[];
};

function formatMonthDay(month: string, day: string): string {
  if (day) return `${month}月${day}日`;
  return `${month}月`;
}

function parseLinks(linkTextCell: string, linkUrlCell: string): HistoryLink[] {
  const texts = linkTextCell.split("\n").map((s) => s.trim());
  const urls = linkUrlCell.split("\n").map((s) => s.trim());
  const links: HistoryLink[] = [];
  for (let i = 0; i < Math.max(texts.length, urls.length); i++) {
    const url = urls[i];
    if (url?.startsWith("http")) {
      links.push({ text: texts[i] || url, url });
    }
  }
  return links;
}

export async function getHistoryEntries(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch(HISTORY_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const entries = rows
      .slice(1)
      .filter((row) => row[1]?.trim() && row[4]?.trim())
      .map((row) => ({
        year: row[1].trim(),
        monthDay: formatMonthDay(row[2]?.trim() ?? "", row[3]?.trim() ?? ""),
        body: row[4].trim(),
        links: parseLinks(row[5]?.trim() ?? "", row[6]?.trim() ?? ""),
      }));
    return entries;
  } catch {
    return [];
  }
}
