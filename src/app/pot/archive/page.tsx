import type { Metadata } from "next";
import Link from "next/link";
import { getMeltedCreatures } from "@/lib/potCreatures";
import { deriveName } from "@/lib/creature";
import { formatDate } from "@/lib/date";

export const metadata: Metadata = { title: "鍋のダシになった子たち" };
export const revalidate = 0;

export default async function PotArchivePage() {
  const creatures = await getMeltedCreatures();

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>鍋のダシになった子たち</h1>
        <p className="page-subtitle">The Pot Archive</p>
      </div>
      <p className="page-caption">
        鍋の中で暮らしたのち、寿命を迎えて溶けていった子たちの記録です。
      </p>
      <p className="pot-archive-back">
        <Link href="/pot">ポトフ鍋に戻る →</Link>
      </p>
      {creatures.length > 0 ? (
        <ul className="pot-archive-list">
          {creatures.map((creature) => (
            <li key={creature.id} className="pot-archive-item">
              <p className="pot-archive-item__name">{deriveName(creature.poem)}</p>
              <p className="pot-archive-item__poem">{creature.poem}</p>
              <p className="pot-archive-item__meta">
                {creature.authorName || "名無し"} ・ {formatDate(creature.createdAt)}に鍋のダシになりました
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-message">まだ誰も鍋のダシになっていません。</p>
      )}
    </div>
  );
}
