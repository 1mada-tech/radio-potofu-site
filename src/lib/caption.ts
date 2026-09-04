import { parse } from "csv-parse/sync";

// 現代川柳ページ用のキャプション。スプレッドシート「公式：現代川柳」タブ。
// 列: キャプション(1行目だけにテンプレート文、[]が空欄) / ランダム候補(空欄に入る単語を1行1件)
const SENRYU_CAPTION_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=1115047140";

export type SenryuCaption = {
  before: string;
  word: string;
  after: string;
  version: string;
  totalVersion: string;
};

export async function getSenryuCaption(): Promise<SenryuCaption | null> {
  try {
    const res = await fetch(SENRYU_CAPTION_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const dataRows = rows.slice(1);

    const template = dataRows.find((row) => row[0]?.trim())?.[0]?.trim() ?? "";
    if (!template.includes("[]")) return null;

    const candidates = dataRows
      .filter((row) => row[1]?.trim())
      .map((row) => ({ word: row[1].trim(), version: row[2]?.trim() ?? "" }));
    if (candidates.length === 0) return null;

    const { word, version } = candidates[Math.floor(Math.random() * candidates.length)];
    const [before, after] = template.split("[]");

    const totalVersion =
      dataRows
        .map((row) => row[3]?.trim())
        .filter((cell): cell is string => Boolean(cell))
        .pop() ?? "";

    return { before, word, after, version, totalVersion };
  } catch {
    return null;
  }
}
