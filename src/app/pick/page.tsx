import type { Metadata } from "next";
import { getEpisodes } from "@/lib/podcast";
import { getPickConfig } from "@/lib/pickConfig";
import PickDraw from "@/components/PickDraw";

export const metadata: Metadata = { title: "きょうはこの回聴いてみて" };
export const revalidate = 60;

export default async function PickPage() {
  const [{ contents }, config] = await Promise.all([
    getEpisodes(9999),
    getPickConfig(),
  ]);

  return (
    <div className="container page">
      <h1>{config.title}</h1>
      <p className="page-subtitle">Today&apos;s Ptf</p>
      <p className="page-caption">{config.caption}</p>
      <PickDraw episodes={contents} buttonLabel={config.buttonLabel} />
    </div>
  );
}
