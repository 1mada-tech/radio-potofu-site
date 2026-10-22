import { getMeltedCreatures } from "@/lib/potCreatures";
import { deriveName } from "@/lib/creature";
import CreatureFace from "@/components/CreatureFace";
import ShareCreatureButton from "@/components/ShareCreatureButton";
import { formatDateTime } from "@/lib/date";

// 鍋で完全に溶けてダシになったキャラの一覧。独立ページにはせず、
// 鍋ページの下にシンプルな追悼コーナーとして添える。
export default async function DashiList() {
  const creatures = await getMeltedCreatures();
  if (creatures.length === 0) return null;

  return (
    <section className="pot-log">
      <h2 className="pot-log__heading">鍋に溶けこんだキャラたち</h2>
      <p className="pot-log__goal">鍋カード第１次目標発行数：151（ポケモン第１世代）</p>
      <ul className="dashi-list">
        {creatures.map((creature, index) => {
          const name = deriveName(creature.poem, creature.createdAt, creature.honorific);
          return (
            <li key={creature.id} className="dashi-card">
              <span className="dashi-card__number" aria-hidden="true">
                {creatures.length - index}.
              </span>
              <span className="dashi-card__face" aria-hidden="true">
                <span className="dashi-card__face-inner">
                  <CreatureFace poem={creature.poem} createdAt={creature.createdAt} />
                </span>
              </span>
              <p className="dashi-card__name">{name}</p>
              <p className="dashi-card__poem">{creature.poem}</p>
              <div className="dashi-card__meta">
                {creature.poetName ? (
                  <span className="dashi-card__author">
                    作: {creature.poetName}(投稿: {creature.authorName || "名無し"})
                  </span>
                ) : (
                  creature.authorName && (
                    <span className="dashi-card__author">{creature.authorName}</span>
                  )
                )}
                <span className="dashi-card__date">{formatDateTime(creature.createdAt)}</span>
              </div>
              <ShareCreatureButton
                poem={creature.poem}
                createdAt={creature.createdAt}
                authorName={creature.authorName}
                poetName={creature.poetName}
                entryNumber={creature.entryNumber}
                note={creature.note}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
