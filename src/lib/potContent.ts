import { parse } from "csv-parse/sync";

// ポトフ鍋ページ用の文言。スプレッドシート「ポトフ鍋」タブ。
// 列: キャプション / 川柳入力エリア(お名前欄→川柳欄→ボタンの順) / 記録エリア(見出し→説明文の順)
const POT_CONTENT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=439142492";

export type PotContent = {
  caption: string;
  formNamePlaceholder: string;
  formPoemPlaceholder: string;
  formSubmitLabel: string;
  logHeading: string;
  logCaptionTemplate: string;
};

const DEFAULT_CONTENT: PotContent = {
  caption:
    "投稿した現代川柳からキャラが生まれて、鍋の中で暮らしはじめます。名前は川柳の中のカタカナ言葉から、いなければ末尾の文字からつけられます。5日経つと、鍋のダシになって溶けてしまいます。",
  formNamePlaceholder: "作者名（任意）",
  formPoemPlaceholder: "川柳を入力するとキャラが鍋に入ります",
  formSubmitLabel: "キャラを鍋に入れる",
  logHeading: "鍋の記録",
  logCaptionTemplate: "鍋が稼働してから0日。これまでの出入り・節目・スープの煮詰まり具合の記録です。",
};

export async function getPotContent(): Promise<PotContent> {
  try {
    const res = await fetch(POT_CONTENT_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const header = rows[0] ?? [];
    const dataRows = rows.slice(1);

    const capIdx = header.findIndex((cell) => cell.trim() === "キャプション");
    const formIdx = header.findIndex((cell) => cell.trim() === "川柳入力エリア");
    const logIdx = header.findIndex((cell) => cell.trim() === "記録エリア");

    const column = (idx: number) =>
      idx === -1
        ? []
        : dataRows.map((row) => row[idx]?.trim()).filter((cell): cell is string => Boolean(cell));

    const capCells = column(capIdx);
    const formCells = column(formIdx);
    const logCells = column(logIdx);

    return {
      caption: capCells[0] ?? DEFAULT_CONTENT.caption,
      formNamePlaceholder: formCells[0] ?? DEFAULT_CONTENT.formNamePlaceholder,
      formPoemPlaceholder: formCells[1] ?? DEFAULT_CONTENT.formPoemPlaceholder,
      formSubmitLabel: formCells[2] ?? DEFAULT_CONTENT.formSubmitLabel,
      logHeading: logCells[0] ?? DEFAULT_CONTENT.logHeading,
      logCaptionTemplate: logCells[1] ?? DEFAULT_CONTENT.logCaptionTemplate,
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}
