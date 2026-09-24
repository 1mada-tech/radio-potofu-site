import { deriveName, POT_LIFESPAN_DAYS } from "@/lib/creature";
import type { PotCreature } from "@/lib/potCreatures";

export type PotEventType = "enter" | "milestone" | "melt" | "flavor";

export type PotEvent = {
  id: string;
  type: PotEventType;
  at: number; // epoch ms(並び替え用)
  message: string;
};

const MILESTONE_STEP = 10;
const DAY_MS = 24 * 60 * 60 * 1000;

// 鍋が稼働してからの経過日数で、スープの煮詰まり具合を表すフレーバー。
const FLAVOR_CHECKPOINTS = [
  { days: 3, message: "スープに少しずつ野菜の甘みが出てきました。" },
  { days: 7, message: "スープにコクが出て、味がまとまってきました。" },
  { days: 14, message: "スープがだいぶ煮詰まってきました。" },
  { days: 30, message: "スープは黄金色にとろりと煮詰まっています。" },
  { days: 60, message: "何度も継ぎ足された、深い味わいのスープになっています。" },
];

// 投稿データから、キャラの出入り・節目・時間経過フレーバーをまとめた
// イベントの時系列を組み立てる(新しい順)。
export function buildPotEvents(creatures: PotCreature[]): PotEvent[] {
  const events: PotEvent[] = [];
  if (creatures.length === 0) return events;

  const startedAt = new Date(creatures[0].createdAt).getTime();
  const now = Date.now();

  creatures.forEach((creature, i) => {
    const count = i + 1;
    const enteredAt = new Date(creature.createdAt).getTime();
    const name = deriveName(creature.poem);

    events.push({
      id: `enter-${creature.id}`,
      type: "enter",
      at: enteredAt,
      message: `${name}が鍋に入りました`,
    });

    if (count % MILESTONE_STEP === 0) {
      events.push({
        id: `milestone-${creature.id}`,
        type: "milestone",
        at: enteredAt,
        message: `${count}匹目、${name}が鍋に入りました！`,
      });
    }

    const meltAt = enteredAt + POT_LIFESPAN_DAYS * DAY_MS;
    if (meltAt <= now) {
      events.push({
        id: `melt-${creature.id}`,
        type: "melt",
        at: meltAt,
        message: `${name}が鍋のダシになりました`,
      });
    }
  });

  for (const checkpoint of FLAVOR_CHECKPOINTS) {
    const at = startedAt + checkpoint.days * DAY_MS;
    if (at <= now) {
      events.push({
        id: `flavor-${checkpoint.days}`,
        type: "flavor",
        at,
        message: checkpoint.message,
      });
    }
  }

  return events.sort((a, b) => b.at - a.at);
}

// 鍋が稼働してからの経過日数(最初の投稿日から)。
export function potAgeDays(creatures: PotCreature[]): number {
  if (creatures.length === 0) return 0;
  const startedAt = new Date(creatures[0].createdAt).getTime();
  return Math.floor((Date.now() - startedAt) / DAY_MS);
}
