import type { Metadata } from "next";
import { getThemePosts } from "@/lib/themes";
import ThemeBoard from "@/components/ThemeBoard";

export const metadata: Metadata = { title: "テーマ募集" };
export const revalidate = 0;

export default async function ThemesPage() {
  const posts = await getThemePosts();

  return (
    <div className="container page">
      <h1>テーマ募集</h1>
      <p className="page-caption">
        次の収録で聴きたいテーマを自由に投稿してください。作り手からの返信もここに届きます。
      </p>
      <ThemeBoard initialPosts={posts} />
    </div>
  );
}
