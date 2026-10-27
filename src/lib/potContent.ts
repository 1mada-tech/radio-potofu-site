import { parse } from "csv-parse/sync";

// ポトフ鍋ページ用の文言。スプレッドシート「ポトフ鍋」タブ。
// 列: キャプション / 川柳入力エリア(投稿者名欄→作者名欄→川柳欄→ボタンの順) / 記録エリア(見出し→説明文の順)
const POT_CONTENT_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=439142492";

export type PotContent = {
  caption: string;
  formNamePlaceholder: string;
  formPoetNamePlaceholder: string;
  formPoemPlaceholder: string;
  formSubmitLabel: string;
  logHeading: string;
  logCaptionTemplate: string;
  tooltipLifespanTemplate: string;
};

const DEFAULT_CONTENT: PotContent = {
  caption:
    "投稿した現代川柳からキャラが生まれて、鍋の中で暮らしはじめます。名前は川柳の中のカタカナ言葉から、いなければ末尾の文字からつけられます。5日経つと、鍋のダシになって溶けてしまいます。",
  formNamePlaceholder: "投稿者名（未入力の場合は「なまえなし」になります）",
  formPoetNamePlaceholder: "作者名（投稿者と別人の場合のみ入力してください）",
  formPoemPlaceholder: "ここに入力した川柳がキャラになり鍋に入ります",
  formSubmitLabel: "キャラを鍋に入れる",
  logHeading: "鍋の記録",
  logCaptionTemplate: "鍋が稼働してから0日。これまでの出入り・節目・スープの煮詰まり具合の記録です。",
  tooltipLifespanTemplate: "あとx日で完全に溶けてダシになります",
};

export async function getPotContent(): Promise<PotContent> {
  try {
    // /pot自体は鍋の中身を常に最新にするためrevalidate:0(フル動的)だが、
    // ここで取っているのは滅多に変わらない文言なので、フェッチ単位では
    // キャッシュして毎回スプレッドシートを叩かないようにする。
    const res = await fetch(POT_CONTENT_CSV_URL, { next: { revalidate: 300 } });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    const header = rows[0] ?? [];
    const dataRows = rows.slice(1);

    const capIdx = header.findIndex((cell) => cell.trim() === "キャプション");
    const formIdx = header.findIndex((cell) => cell.trim() === "川柳入力エリア");
    const logIdx = header.findIndex((cell) => cell.trim() === "記録エリア");
    const tooltipIdx = header.findIndex((cell) => cell.trim() === "キャラマウスオーバー");

    const column = (idx: number) =>
      idx === -1
        ? []
        : dataRows.map((row) => row[idx]?.trim()).filter((cell): cell is string => Boolean(cell));

    const capCells = column(capIdx);
    const formCells = column(formIdx);
    const logCells = column(logIdx);
    const tooltipCells = column(tooltipIdx);

    return {
      caption: capCells[0] ?? DEFAULT_CONTENT.caption,
      formNamePlaceholder: formCells[0] ?? DEFAULT_CONTENT.formNamePlaceholder,
      formPoetNamePlaceholder: formCells[1] ?? DEFAULT_CONTENT.formPoetNamePlaceholder,
      formPoemPlaceholder: formCells[2] ?? DEFAULT_CONTENT.formPoemPlaceholder,
      formSubmitLabel: formCells[3] ?? DEFAULT_CONTENT.formSubmitLabel,
      logHeading: logCells[0] ?? DEFAULT_CONTENT.logHeading,
      logCaptionTemplate: logCells[1] ?? DEFAULT_CONTENT.logCaptionTemplate,
      // 先頭3行(キャラ名/川柳本文/名前・日付)はどの内容が入るかのラベルなので使わず、
      // 実際に編集可能な文言である最後の行(残り日数のテンプレート)だけを使う。
      tooltipLifespanTemplate: tooltipCells[tooltipCells.length - 1] ?? DEFAULT_CONTENT.tooltipLifespanTemplate,
    };
  } catch {
    return DEFAULT_CONTENT;
  }
}
