import { readFile } from "fs/promises";
import path from "path";

// 現代川柳ページ用のキャプション。1行目が本文テンプレート([]が空欄)、
// 3行目以降が空欄に入る候補の単語([単語]の形)。テキストファイルは
// web/content/senryu-caption.txt にあり、随時単語を追加してもらう想定。
const CAPTION_FILE = path.join(process.cwd(), "content", "senryu-caption.txt");

export type SenryuCaption = {
  before: string;
  word: string;
  after: string;
};

export async function getSenryuCaption(): Promise<SenryuCaption | null> {
  try {
    const text = await readFile(CAPTION_FILE, "utf-8");
    const lines = text.split(/\r?\n/);
    const template = lines[0] ?? "";
    if (!template.includes("[]")) return null;

    const words = lines
      .slice(2)
      .map((line) => line.match(/\[(.+?)\]/)?.[1])
      .filter((word): word is string => Boolean(word));
    if (words.length === 0) return null;

    const word = words[Math.floor(Math.random() * words.length)];
    const [before, after] = template.split("[]");
    return { before, word, after };
  } catch {
    return null;
  }
}
