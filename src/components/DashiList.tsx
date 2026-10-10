import { getMeltedCreatures } from "@/lib/potCreatures";
import { deriveName } from "@/lib/creature";
import CreatureFace from "@/components/CreatureFace";
import { formatDateTime } from "@/lib/date";

// 鍋で完全に溶けてダシになったキャラの一覧。独立ページにはせず、
// 鍋ページの下にシンプルな追悼コーナーとして添える。
export default async function DashiList() {
  const creatures = await getMeltedCreatures();
  if (creatures.length === 0) return null;

  return (
    <section className="pot-log">
      <h2 className="pot-log__heading">鍋に溶けこんだキャラたち</h2>
      <ul className="dashi-list">
        {creatures.map((creature) => {
          const name = deriveName(creature.poem, creature.createdAt);
          return (
            <li key={creature.id} className="dashi-card">
              <span className="dashi-card__face" aria-hidden="true">
                <span className="dashi-card__face-inner">
                  <CreatureFace poem={creature.poem} createdAt={creature.createdAt} />
                </span>
              </span>
              <p className="dashi-card__name">{name}</p>
              <p className="dashi-card__poem">{creature.poem}</p>
              <div className="dashi-card__meta">
                {creature.authorName && (
                  <span className="dashi-card__author">{creature.authorName}</span>
                )}
                <span className="dashi-card__date">{formatDateTime(creature.createdAt)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
