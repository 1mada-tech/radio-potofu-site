import { getPublishedEncounters } from "@/lib/potEncounters";
import { deriveName } from "@/lib/creature";
import { SCENE_LABELS } from "@/lib/encounterShareImage";
import CreatureFace from "@/components/CreatureFace";
import ShareEncounterButton from "@/components/ShareEncounterButton";
import { formatDateTime } from "@/lib/date";

// 完成済みの「遭遇シーン」を並べる公開ギャラリー。DashiList.tsxと同じ骨格
// (まだ1件もなければ何も出さない、独立ページにはせず鍋ページに添える)。
export default async function EncounterGallery() {
  const encounters = await getPublishedEncounters();
  if (encounters.length === 0) return null;

  return (
    <section className="pot-log">
      <h2 className="pot-log__heading">出会いのギャラリー</h2>
      <ul className="encounter-gallery">
        {encounters.map((encounter) => {
          const nameA = deriveName(
            encounter.creatureA.poem,
            encounter.creatureA.createdAt,
            encounter.creatureA.honorific,
            encounter.creatureA.entryNumber,
          );
          const nameB = deriveName(
            encounter.creatureB.poem,
            encounter.creatureB.createdAt,
            encounter.creatureB.honorific,
            encounter.creatureB.entryNumber,
          );
          return (
            <li key={encounter.id} className="encounter-card">
              <div className="encounter-card__faces" aria-hidden="true">
                <span className="encounter-card__face-wrap">
                  <span className="encounter-card__face-inner">
                    <CreatureFace poem={encounter.creatureA.poem} createdAt={encounter.creatureA.createdAt} />
                  </span>
                </span>
                <span className="encounter-card__cross">×</span>
                <span className="encounter-card__face-wrap">
                  <span className="encounter-card__face-inner">
                    <CreatureFace poem={encounter.creatureB.poem} createdAt={encounter.creatureB.createdAt} />
                  </span>
                </span>
              </div>
              <p className="encounter-card__names">
                {nameA} × {nameB}
              </p>
              <p className="encounter-card__scene">{SCENE_LABELS[encounter.scene]}</p>
              <p className="encounter-card__note">{encounter.note}</p>
              <div className="encounter-card__meta">
                <span className="encounter-card__date">
                  {encounter.metAt ? formatDateTime(encounter.metAt) : ""}
                </span>
              </div>
              <ShareEncounterButton
                scene={encounter.scene}
                creatureA={encounter.creatureA}
                creatureB={encounter.creatureB}
                encounterNote={encounter.note ?? ""}
                metAt={encounter.metAt ?? undefined}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
