import { pool } from "@/lib/db";

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

export async function getPotCreatures(): Promise<PotCreature[]> {
  const { rows } = await pool.query<Row>(
    "SELECT id, author_name, poem, created_at FROM pot_creatures ORDER BY created_at ASC",
  );
  return rows.map((row) => ({
    id: row.id,
    authorName: row.author_name,
    poem: row.poem,
    createdAt: row.created_at,
  }));
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
