import { deriveName, hashString, makeRng, POT_LIFESPAN_DAYS } from "@/lib/creature";
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

// ダシになる(=鍋から卒業する)瞬間の、最後のひとこと。
// キャラごとに同じ川柳からは常に同じ一言になるよう、poemをもとに
// 決定的に選ぶ(deriveName等と同じ流儀)。
const LAST_WORDS = [
  "ここにいられて、悪くなかったよ",
  "スープになるの、思ったより怖くなかった",
  "次の子によろしく",
  "あ、今ちょっと名残惜しいかも",
  "……あっさり系だった方がよかったかな",
  "最後まで、自分の味がよく分からなかったな",
  "みんな、ありがとう",
  "そろそろかなとは思ってたんだ",
  "また別の形で会えたらいいな",
  "この鍋、最後まで悪くなかったよ",
];

function pickLastWords(poem: string): string {
  const rng = makeRng(hashString(`${poem}::lastwords`) || 1);
  return LAST_WORDS[Math.floor(rng() * LAST_WORDS.length)];
}

// 鍋が稼働してからの経過日数で、スープの煮詰まり具合を表すフレーバー。
const FLAVOR_CHECKPOINTS = [
  { days: 1, message: "火を入れたばかりで、まだ湯気も控えめです。" },
  { days: 2, message: "具材同士がようやく馴染みはじめました。" },
  { days: 3, message: "スープに少しずつ川柳の甘みが出てきました。" },
  { days: 5, message: "ようやく鍋全体が温まってきました。" },
  { days: 7, message: "スープにコクが出て、味がまとまってきました。" },
  { days: 10, message: "新しい具材の香りが鍋いっぱいに広がっています。" },
  { days: 14, message: "スープがだいぶ煮詰まってきました。" },
  { days: 21, message: "スープに深みが増し、底の方で静かに対流しています。" },
  { days: 30, message: "スープは黄金色にとろりと煮詰まっています。" },
  { days: 45, message: "長く煮込まれ、スープの色がさらに濃くなってきました。" },
  { days: 60, message: "何度も継ぎ足された、深い味わいのスープになっています。" },
  { days: 90, message: "三か月分の川柳が溶け込んだ、奥行きのあるスープです。" },
  { days: 120, message: "もはや最初の具材の面影はなく、渾然一体となっています。" },
  { days: 150, message: "五か月、絶やさず火を入れ続けています。" },
  { days: 180, message: "半年かけて育てたスープは、もう立派な名物です。" },
  { days: 210, message: "鍋のまわりにも貫禄が出てきました。" },
  { days: 270, message: "九か月、休まず火にかけ続けています。" },
  { days: 365, message: "一年間休まず継ぎ足されたスープ。もはや伝説の域です。" },
  { days: 500, message: "500日を超えて煮込まれた、歴史の味がします。" },
  { days: 730, message: "二年間、絶えず煮込まれ続けている不滅のスープです。" },
  { days: 1000, message: "1000日選手のスープ。もう何が入っていたか誰も覚えていません。" },
  { days: 1500, message: "もはや鍋そのものがこの番組の象徴になっています。" },
  { days: 2000, message: "2000日、ただひたすら煮込まれ続けています。" },
  { days: 3000, message: "3000日目にしてなお、鍋の火は消えていません。" },
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
    const name = deriveName(creature.poem, creature.createdAt);

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
        message: `${name}が完全に溶け、鍋のダシになりました。「${pickLastWords(creature.poem)}」`,
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

// 鍋が稼働してからの経過時間(最初の投稿日時から、時間単位)。
// 稼働してまだ日が浅いうちは「◯日」だと変化が分かりにくいため、
// 鍋の記録のキャプションにはこちらを使っている。
export function potAgeHours(creatures: PotCreature[]): number {
  if (creatures.length === 0) return 0;
  const startedAt = new Date(creatures[0].createdAt).getTime();
  return Math.floor((Date.now() - startedAt) / (60 * 60 * 1000));
}

// 鍋が稼働してからの経過日数(最初の投稿日から)。
export function potAgeDays(creatures: PotCreature[]): number {
  if (creatures.length === 0) return 0;
  const startedAt = new Date(creatures[0].createdAt).getTime();
  return Math.floor((Date.now() - startedAt) / DAY_MS);
}
