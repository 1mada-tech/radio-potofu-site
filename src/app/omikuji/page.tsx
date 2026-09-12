import type { Metadata } from "next";
import { getEpisodes } from "@/lib/podcast";
import OmikujiDraw from "@/components/OmikujiDraw";

export const metadata: Metadata = { title: "きょうはこの回聴いてみて" };
export const revalidate = 60;

export default async function OmikujiPage() {
  const { contents } = await getEpisodes(9999);

  return (
    <div className="container page">
      <h1>きょうはこの回聴いてみて</h1>
      <p className="page-caption">
        ボタンを押すと、これまでの配信からランダムに1回選ばれます。思いもよらない一本と出会ってみてください。
      </p>
      <OmikujiDraw episodes={contents} />
    </div>
  );
}
