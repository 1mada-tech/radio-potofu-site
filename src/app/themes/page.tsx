import type { Metadata } from "next";
import { getThemePosts } from "@/lib/themes";
import { getSimpleCaption } from "@/lib/pageCaption";
import ThemeBoard from "@/components/ThemeBoard";

export const metadata: Metadata = { title: "テーマ募集" };
export const revalidate = 0;

const THEMES_CAPTION_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=204925422";

const DEFAULT_CAPTION =
  "次の収録で聴きたいテーマを自由に投稿してください。作り手からの返信もここに届きます。";

export default async function ThemesPage() {
  const [posts, caption] = await Promise.all([
    getThemePosts(),
    getSimpleCaption(THEMES_CAPTION_CSV_URL),
  ]);

  return (
    <div className="container page">
      <h1>テーマ募集</h1>
      <p className="page-caption">{caption ?? DEFAULT_CAPTION}</p>
      <ThemeBoard initialPosts={posts} />
    </div>
  );
}
