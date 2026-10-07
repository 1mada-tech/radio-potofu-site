import type { Metadata } from "next";
import { getEpisodes } from "@/lib/podcast";
import { getPickConfig } from "@/lib/pickConfig";
import PickDraw from "@/components/PickDraw";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "きょうのあなたへ",
  description: "きょうのあなたへおすすめしたい回を紹介します。",
  path: "/pick",
});
export const revalidate = 60;

export default async function PickPage() {
  const [{ contents }, config] = await Promise.all([
    getEpisodes(9999),
    getPickConfig(),
  ]);

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>{config.title}</h1>
        <p className="page-subtitle">Today&apos;s Ptf</p>
      </div>
      <p className="page-caption page-caption--center">{config.caption}</p>
      <PickDraw episodes={contents} buttonLabel={config.buttonLabel} />
    </div>
  );
}
