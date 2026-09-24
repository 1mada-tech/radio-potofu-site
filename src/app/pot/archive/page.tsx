import type { Metadata } from "next";
import Link from "next/link";
import { getAllPotCreatures } from "@/lib/potCreatures";
import { buildPotEvents, potAgeDays, type PotEventType } from "@/lib/potLog";

export const metadata: Metadata = { title: "鍋の記録" };
export const revalidate = 0;

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

export default async function PotArchivePage() {
  const creatures = await getAllPotCreatures();
  const events = buildPotEvents(creatures);
  const ageDays = potAgeDays(creatures);

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>鍋の記録</h1>
        <p className="page-subtitle">The Pot Log</p>
      </div>
      <p className="page-caption">
        {creatures.length > 0
          ? `鍋が稼働してから${ageDays}日。これまでの出入り・節目・スープの煮詰まり具合の記録です。`
          : "まだ鍋は動いていません。最初の一匹を投稿してみませんか？"}
      </p>
      <p className="pot-archive-back">
        <Link href="/pot">ポトフ鍋に戻る →</Link>
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
    </div>
  );
}
