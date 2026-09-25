import { buildPotEvents, potAgeDays, type PotEventType } from "@/lib/potLog";
import type { PotCreature } from "@/lib/potCreatures";

const EVENT_LABEL: Record<PotEventType, string> = {
  enter: "投入",
  milestone: "節目",
  melt: "完成",
  flavor: "経過",
};

function formatDateTime(at: number) {
  const date = new Date(at);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

export default function PotLog({
  creatures,
  heading,
  captionTemplate,
}: {
  creatures: PotCreature[];
  heading: string;
  captionTemplate: string;
}) {
  const events = buildPotEvents(creatures);
  const ageDays = potAgeDays(creatures);

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
          {events.map((event) => (
            <li key={event.id} className={`pot-log-item pot-log-item--${event.type}`}>
              <span className="pot-log-item__date">{formatDateTime(event.at)}</span>
              <span className="pot-log-item__label">{EVENT_LABEL[event.type]}</span>
              <span className="pot-log-item__message">{event.message}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-message">まだ記録がありません。</p>
      )}
    </section>
  );
}
