import { parse } from "csv-parse/sync";

// 現代川柳ネットプリントの発行情報スプレッドシート(タブ名「ネプリ」)。
// 列: 号数 / ラジオポトフ / 発行年月日 / (記号) / 半期(上・下) / (記号) / テーマ / (記号) / ファイル名 / 内容
export const NETPRINT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=1900237014";

export type NetprintIssue = {
  issue: string;
  publishDate: string;
  half: string;
  theme: string;
  fileUrl: string;
  content: string;
};

export async function getNetprintIssues(): Promise<NetprintIssue[]> {
  try {
    const res = await fetch(NETPRINT_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const issues = rows
      .slice(1)
      .filter((row) => row[0]?.trim())
      .map((row) => ({
        issue: row[0].trim(),
        publishDate: row[2]?.trim() ?? "",
        half: row[6]?.trim() ?? "",
        theme: row[8]?.trim() ?? "",
        fileUrl: `/netprints/${encodeURIComponent(row[10]?.trim() ?? "")}.pdf`,
        content: row[11]?.trim() ?? "",
      }));
    return issues.sort((a, b) => (a.issue < b.issue ? 1 : -1));
  } catch {
    return [];
  }
}
