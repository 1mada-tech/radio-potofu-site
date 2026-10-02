import { buildPotEvents, potAgeDays, type PotEventType } from "@/lib/potLog";
import { deriveName, daysLeft } from "@/lib/creature";
import { formatDate, formatDateTime } from "@/lib/date";
import type { PotCreature } from "@/lib/potCreatures";
import CreatureFace from "@/components/CreatureFace";

const EVENT_LABEL: Record<PotEventType, string> = {
  enter: "投入",
  milestone: "節目",
  melt: "完成",
  flavor: "経過",
};

export default function PotLog({
  creatures,
  heading,
  captionTemplate,
  tooltipLifespanTemplate,
}: {
  creatures: PotCreature[];
  heading: string;
  captionTemplate: string;
  tooltipLifespanTemplate: string;
}) {
  const events = buildPotEvents(creatures);
  const ageDays = potAgeDays(creatures);
  const creatureById = new Map(creatures.map((c) => [String(c.id), c]));

  // event.id は "enter-123" "milestone-123" "melt-123" "flavor-3" の形。
  // キャラ本体に紐づくイベント(enter/milestone/melt)だけ、末尾のIDから
  // 元のキャラを逆引きしてミニ顔アイコンを出す。flavorは特定のキャラに
  // 紐づかないイベントなので対象外。
  function creatureForEvent(event: { id: string; type: PotEventType }): PotCreature | null {
    if (event.type === "flavor") return null;
    const creatureId = event.id.slice(event.id.indexOf("-") + 1);
    return creatureById.get(creatureId) ?? null;
  }

  return (
    <section className="pot-log">
      <h2 className="pot-log__heading">{heading}</h2>
      <p className="pot-log__caption">
        {creatures.length > 0
          ? captionTemplate.replace(/\d+日/, `${ageDays}日`)
          : "まだ鍋は動いていません。最初の一匹を投稿してみませんか？"}
      </p>
      {events.length > 0 ? (
        <ul className="pot-log-list">
          {events.map((event) => {
            const creature = creatureForEvent(event);
            return (
              <li key={event.id} className={`pot-log-item pot-log-item--${event.type}`}>
                <span className="pot-log-item__date">{formatDateTime(event.at)}</span>
                <span className="pot-log-item__label">{EVENT_LABEL[event.type]}</span>
                <span className="pot-log-item__message">{event.message}</span>
                {creature && (
                  <span className="pot-log-item__face-wrap" tabIndex={0}>
                    <span className="pot-log-item__face" aria-hidden="true">
                      <CreatureFace poem={creature.poem} />
                    </span>
                    {/* 鍋の中のキャラにマウスオーバーした時と同じ内容のツールチップ。 */}
                    <div className="pot__tooltip pot-log-item__tooltip" aria-hidden="true">
                      <div className="pot__tooltip-head">
                        <span className="pot__tooltip-face" aria-hidden="true">
                          <CreatureFace poem={creature.poem} />
                        </span>
                        <p className="pot__tooltip-name">
                          {deriveName(creature.poem, creature.createdAt)}
                        </p>
                      </div>
                      <p className="pot__tooltip-poem">{creature.poem}</p>
                      <p className="pot__tooltip-meta">
                        {creature.authorName || "名無し"} ・ {formatDate(creature.createdAt)}
                      </p>
                      <p className="pot__tooltip-lifespan">
                        {tooltipLifespanTemplate.replace(
                          "x日",
                          `${daysLeft(creature.createdAt)}日`,
                        )}
                      </p>
                    </div>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty-message">まだ記録がありません。</p>
      )}
    </section>
  );
}
