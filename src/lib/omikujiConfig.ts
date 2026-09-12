import { parse } from "csv-parse/sync";

// 「きょうはこの回聴いてみて」ページの設定スプレッドシート(タブ名「公式：ランダム回表示」)。
// 行: タイトル / キャプション / ボタンの上(仕様メモ、実装側で解釈) / ボタンの文言
const OMIKUJI_CONFIG_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=764477297";

export type OmikujiConfig = {
  title: string;
  caption: string;
  buttonLabel: string;
};

const fallback: OmikujiConfig = {
  title: "きょうはこの回聴いてみて",
  caption:
    "ボタンを押すと、これまでの配信からランダムに1回選ばれます。思いもよらない一本と出会ってみてください。",
  buttonLabel: "に聴くべき回",
};

export async function getOmikujiConfig(): Promise<OmikujiConfig> {
  try {
    const res = await fetch(OMIKUJI_CONFIG_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const map = new Map(rows.map((row) => [row[0]?.trim(), row[1]?.trim()]));
    return {
      title: map.get("タイトル") || fallback.title,
      caption: map.get("キャプション") || fallback.caption,
      buttonLabel: map.get("ボタンの文言") || fallback.buttonLabel,
    };
  } catch {
    return fallback;
  }
}
