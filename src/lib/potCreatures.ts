import { pool } from "@/lib/db";
import { POT_LIFESPAN_DAYS, deriveNameParts, pickAvailableHonorific } from "@/lib/creature";

export type PotCreature = {
  id: number;
  authorName: string | null;
  // 川柳の作者名(投稿者本人と異なる場合のみ)。nullなら投稿者本人の作品。
  poetName: string | null;
  poem: string;
  createdAt: string;
  // 鍋への投入順(1始まり)。センカのカード番号表示用。テスト投入・削除で
  // idに欠番ができてもずれないよう、idではなくcreated_at順の件数から出す。
  entryNumber: number;
  // 鍋カード(住民票)のひとことメッセージ。発行(手書き)前はnull。
  note: string | null;
  // 敬称(「くん」「先生」等)。投入時に一度だけ決めてここに固定する
  // (同じ鍋にいる他のキャラと名前が重複しないようpickAvailableHonorificで
  // 選ぶため、句のハッシュ値だけから毎回計算し直すことはしない)。
  honorific: string;
};

type Row = {
  id: number;
  author_name: string | null;
  poet_name: string | null;
  poem: string;
  created_at: string;
  entry_number: string; // COUNT(*)はbigintで返るのでpgはstringにする
  note: string | null;
  honorific: string;
};

function toCreature(row: Row): PotCreature {
  return {
    id: row.id,
    authorName: row.author_name,
    poetName: row.poet_name,
    poem: row.poem,
    createdAt: row.created_at,
    entryNumber: Number(row.entry_number),
    note: row.note,
    honorific: row.honorific,
  };
}

const ENTRY_NUMBER_SELECT = `
  (SELECT COUNT(*) FROM pot_creatures c2 WHERE c2.created_at <= c1.created_at) AS entry_number
`;

// まだ溶けていない(鍋の中で暮らしている)キャラ一覧。
export async function getPotCreatures(): Promise<PotCreature[]> {
  const { rows } = await pool.query<Row>(
    `SELECT c1.id, c1.author_name, c1.poet_name, c1.poem, c1.created_at, c1.note, c1.honorific, ${ENTRY_NUMBER_SELECT}
     FROM pot_creatures c1
     WHERE c1.created_at >= now() - interval '${POT_LIFESPAN_DAYS} days'
     ORDER BY c1.created_at ASC`,
  );
  return rows.map(toCreature);
}

// 寿命を迎えて鍋のダシになった(アーカイブ入りした)キャラ一覧。新しい順。
export async function getMeltedCreatures(): Promise<PotCreature[]> {
  const { rows } = await pool.query<Row>(
    `SELECT c1.id, c1.author_name, c1.poet_name, c1.poem, c1.created_at, c1.note, c1.honorific, ${ENTRY_NUMBER_SELECT}
     FROM pot_creatures c1
     WHERE c1.created_at < now() - interval '${POT_LIFESPAN_DAYS} days'
     ORDER BY c1.created_at DESC`,
  );
  return rows.map(toCreature);
}

// 記録ページ用。生死問わず全員を古い順で返す。
export async function getAllPotCreatures(): Promise<PotCreature[]> {
  const { rows } = await pool.query<Row>(
    `SELECT c1.id, c1.author_name, c1.poet_name, c1.poem, c1.created_at, c1.note, c1.honorific, ${ENTRY_NUMBER_SELECT}
     FROM pot_creatures c1
     ORDER BY c1.created_at ASC`,
  );
  return rows.map(toCreature);
}

// これまでに鍋へ投入された総数(生死問わず)。第1次/第2次目標発行数の
// 達成判定や、世代(第1世代/第2世代)の切り替え表示に使う。
export async function getTotalIssuedCount(): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    `SELECT COUNT(*) FROM pot_creatures`,
  );
  return Number(rows[0].count);
}

// 僕(Claude)が鍋カードのひとことメッセージを手書きしたあと、DBに書き込むための更新。
export async function setPotCreatureNote(id: number, note: string): Promise<void> {
  await pool.query(`UPDATE pot_creatures SET note = $1 WHERE id = $2`, [note, id]);
}

export async function createPotCreature(params: {
  authorName: string;
  poetName?: string;
  poem: string;
}): Promise<PotCreature | null> {
  const authorName = params.authorName.trim().slice(0, 50) || null;
  const poetName = params.poetName?.trim().slice(0, 50) || null;
  const poem = params.poem.trim().slice(0, 200);
  if (!poem) return null;

  // 過去に鍋へ入った全員(今いる面々も、溶けて消えた子も)と名前(本体+
  // 敬称)が重複しないよう、投入前に先客の名前一覧を取っておく。
  const { rows: pastRows } = await pool.query<{ poem: string; created_at: string; honorific: string }>(
    `SELECT poem, created_at, honorific FROM pot_creatures`,
  );
  const takenNames = pastRows.map(
    (c) => deriveNameParts(c.poem, c.created_at).base + c.honorific,
  );
  const honorific = pickAvailableHonorific(poem, undefined, takenNames);

  const { rows } = await pool.query<Row>(
    `WITH inserted AS (
       INSERT INTO pot_creatures (author_name, poet_name, poem, honorific) VALUES ($1, $2, $3, $4)
       RETURNING id, author_name, poet_name, poem, created_at, note, honorific
     )
     SELECT c1.id, c1.author_name, c1.poet_name, c1.poem, c1.created_at, c1.note, c1.honorific, ${ENTRY_NUMBER_SELECT}
     FROM inserted c1`,
    [authorName, poetName, poem, honorific],
  );
  return toCreature(rows[0]);
}
