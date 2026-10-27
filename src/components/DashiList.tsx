import { getMeltedCreatures, getTotalIssuedCount } from "@/lib/potCreatures";
import { deriveName } from "@/lib/creature";
import { GENERATION_CUTOFF } from "@/lib/shareImage";
import CreatureFace from "@/components/CreatureFace";
import ShareCreatureButton from "@/components/ShareCreatureButton";
import { formatDateTime } from "@/lib/date";

// 第2次目標発行数(251匹、ポケモン第1+第2世代の合計になぞらえた数字)。
const GENERATION_2_GOAL = 251;

// 鍋で完全に溶けてダシになったキャラの一覧。独立ページにはせず、
// 鍋ページの下にシンプルな追悼コーナーとして添える。
export default async function DashiList() {
  const [creatures, totalIssued] = await Promise.all([
    getMeltedCreatures(),
    getTotalIssuedCount(),
  ]);
  if (creatures.length === 0) return null;

  const goalText =
    totalIssued > GENERATION_CUTOFF
      ? `鍋カード第２次目標発行数：${GENERATION_2_GOAL}（ポケモン第２世代まで）`
      : `鍋カード第１次目標発行数：${GENERATION_CUTOFF}（ポケモン第１世代）`;

  return (
    <section className="pot-log">
      <h2 className="pot-log__heading">鍋に溶けこんだキャラたち</h2>
      <p className="pot-log__goal">{goalText}</p>
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
                    作: {creature.poetName}(投稿: {creature.authorName || "なまえなし"})
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
