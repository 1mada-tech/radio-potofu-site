import type { Metadata } from "next";
import { getEpisodes } from "@/lib/podcast";
import { getOmikujiConfig } from "@/lib/omikujiConfig";
import OmikujiDraw from "@/components/OmikujiDraw";

export const metadata: Metadata = { title: "きょうはこの回聴いてみて" };
export const revalidate = 60;

export default async function OmikujiPage() {
  const [{ contents }, config] = await Promise.all([
    getEpisodes(9999),
    getOmikujiConfig(),
  ]);

  return (
    <div className="container page">
      <h1>{config.title}</h1>
      <p className="page-caption">{config.caption}</p>
      <OmikujiDraw episodes={contents} buttonLabel={config.buttonLabel} />
    </div>
  );
}
