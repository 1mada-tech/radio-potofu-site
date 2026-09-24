import { pool } from "@/lib/db";
import { POT_LIFESPAN_DAYS } from "@/lib/creature";

export type PotCreature = {
  id: number;
  authorName: string | null;
  poem: string;
  createdAt: string;
};

type Row = {
  id: number;
  author_name: string | null;
  poem: string;
  created_at: string;
};

function toCreature(row: Row): PotCreature {
  return {
    id: row.id,
    authorName: row.author_name,
    poem: row.poem,
    createdAt: row.created_at,
  };
}

// まだ溶けていない(鍋の中で暮らしている)キャラ一覧。
export async function getPotCreatures(): Promise<PotCreature[]> {
  const { rows } = await pool.query<Row>(
    `SELECT id, author_name, poem, created_at FROM pot_creatures
     WHERE created_at >= now() - interval '${POT_LIFESPAN_DAYS} days'
     ORDER BY created_at ASC`,
  );
  return rows.map(toCreature);
}

// 寿命を迎えて鍋のダシになった(アーカイブ入りした)キャラ一覧。新しい順。
export async function getMeltedCreatures(): Promise<PotCreature[]> {
  const { rows } = await pool.query<Row>(
    `SELECT id, author_name, poem, created_at FROM pot_creatures
     WHERE created_at < now() - interval '${POT_LIFESPAN_DAYS} days'
     ORDER BY created_at DESC`,
  );
  return rows.map(toCreature);
}

// 記録ページ用。生死問わず全員を古い順で返す。
export async function getAllPotCreatures(): Promise<PotCreature[]> {
  const { rows } = await pool.query<Row>(
    "SELECT id, author_name, poem, created_at FROM pot_creatures ORDER BY created_at ASC",
  );
  return rows.map(toCreature);
}

export async function createPotCreature(params: {
  authorName: string;
  poem: string;
}): Promise<void> {
  const authorName = params.authorName.trim().slice(0, 50) || null;
  const poem = params.poem.trim().slice(0, 200);
  if (!poem) return;

  await pool.query(
    "INSERT INTO pot_creatures (author_name, poem) VALUES ($1, $2)",
    [authorName, poem],
  );
}
