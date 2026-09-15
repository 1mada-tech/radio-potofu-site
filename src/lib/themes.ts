import { pool } from "@/lib/db";

export type ThemeStatus = "considering" | "adopted" | "recorded" | null;

export type ThemePost = {
  id: number;
  parentId: number | null;
  authorName: string | null;
  body: string;
  status: ThemeStatus;
  createdAt: string;
  replies: ThemePost[];
};

type Row = {
  id: number;
  parent_id: number | null;
  author_name: string | null;
  body: string;
  status: ThemeStatus;
  created_at: string;
};

export async function getThemePosts(): Promise<ThemePost[]> {
  const { rows } = await pool.query<Row>(
    "SELECT id, parent_id, author_name, body, status, created_at FROM theme_posts ORDER BY created_at ASC",
  );

  const byId = new Map<number, ThemePost>();
  const roots: ThemePost[] = [];

  for (const row of rows) {
    byId.set(row.id, {
      id: row.id,
      parentId: row.parent_id,
      authorName: row.author_name,
      body: row.body,
      status: row.status,
      createdAt: row.created_at,
      replies: [],
    });
  }

  for (const post of byId.values()) {
    if (post.parentId && byId.has(post.parentId)) {
      byId.get(post.parentId)!.replies.push(post);
    } else if (!post.parentId) {
      roots.push(post);
    }
  }

  roots.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return roots;
}

export async function createThemePost(input: {
  parentId?: number | null;
  authorName?: string | null;
  body: string;
}): Promise<void> {
  const body = input.body.trim().slice(0, 1000);
  if (!body) return;
  const authorName = input.authorName?.trim().slice(0, 50) || null;
  await pool.query(
    "INSERT INTO theme_posts (parent_id, author_name, body) VALUES ($1, $2, $3)",
    [input.parentId ?? null, authorName, body],
  );
}

export async function updateThemeStatus(
  id: number,
  status: ThemeStatus,
): Promise<void> {
  await pool.query("UPDATE theme_posts SET status = $1 WHERE id = $2 AND parent_id IS NULL", [
    status,
    id,
  ]);
}

// 返信もON DELETE CASCADEで一緒に削除される。
export async function deleteThemePost(id: number): Promise<void> {
  await pool.query("DELETE FROM theme_posts WHERE id = $1", [id]);
}
