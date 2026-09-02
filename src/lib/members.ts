import { parse } from "csv-parse/sync";

// トップページ「こんなひとたち」用のメンバー一覧。スプレッドシート「公式：こんなひとたち」タブ。
// 列がメンバー1人ずつ、行が属性（参加度／肩書き／メンバー名／ローマ字読み／紹介文／リンク）という転置形式。
const MEMBERS_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=11136023";

export type Member = {
  name: string;
  title?: string;
  romaji?: string;
  participation?: string;
  bio?: string;
  link?: string;
};

export async function getMembers(): Promise<Member[]> {
  try {
    const res = await fetch(MEMBERS_CSV_URL, { cache: "no-store" });
    const text = await res.text();
    const rows: string[][] = parse(text, { skip_empty_lines: true });
    if (rows.length === 0) return [];

    const rowFor = (label: string) => rows.find((row) => row[0]?.trim() === label);
    const participationRow = rowFor("参加度");
    const titleRow = rowFor("肩書き");
    const nameRow = rowFor("メンバー名");
    const romajiRow = rowFor("ローマ字読み");
    const bioRow = rowFor("紹介文");
    const linkRow = rowFor("リンク");
    if (!nameRow) return [];

    const memberCount = nameRow.length - 1;
    const members: Member[] = [];
    for (let i = 1; i <= memberCount; i++) {
      const name = nameRow[i]?.trim();
      if (!name) continue;
      members.push({
        name,
        title: titleRow?.[i]?.trim() || undefined,
        romaji: romajiRow?.[i]?.trim() || undefined,
        participation: participationRow?.[i]?.trim() || undefined,
        bio: bioRow?.[i]?.trim() || undefined,
        link: linkRow?.[i]?.trim() || undefined,
      });
    }
    return members;
  } catch {
    return [];
  }
}
