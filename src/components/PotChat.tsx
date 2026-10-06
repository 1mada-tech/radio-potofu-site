import { deriveName, deriveNameParts, COMFORTABLE_COUNT } from "@/lib/creature";
import { getEpisodes } from "@/lib/podcast";
import { getNoteArticles } from "@/lib/noteFeed";
import { getMeltedCreatures } from "@/lib/potCreatures";
import type { PotCreature } from "@/lib/potCreatures";
import PotChatModal from "@/components/PotChatModal";

// 話題にする過去分の件数。最新だけでなく、少しさかのぼった分も
// 候補に入れる(実際にどれが選ばれるかはpotChat.ts側で最新重視の
// 重み付けランダム)。
const TOPIC_HISTORY_COUNT = 6;

// 「鍋内のひととき」: ボタンを押すと、今鍋の中にいるキャラのアイコン
// 一覧と、その面々の会話(自動生成・文字起こし体)をポップアップで見せる。
// エピソード/note記事のタイトルも、話題として会話に混ぜている
// (最新のものを中心に、過去のものもたまに登場する)。
export default async function PotChat({ creatures }: { creatures: PotCreature[] }) {
  // 鍋の中に実際に見えている面々(待機列は含めない)。
  const inPot = creatures.slice(0, COMFORTABLE_COUNT);
  if (inPot.length === 0) return null;

  const roster = inPot.map((c) => {
    const { base, honorific } = deriveNameParts(c.poem, c.createdAt);
    return { poem: c.poem, name: `${base}${honorific}`, honorific, createdAt: c.createdAt };
  });

  const [{ contents: episodes }, noteArticles, meltedCreatures] = await Promise.all([
    getEpisodes(TOPIC_HISTORY_COUNT),
    getNoteArticles(),
    getMeltedCreatures(),
  ]);

  const episodeTopics = episodes
    .map((e) => ({ title: e.title, url: e.spotifyUrl ?? e.appleUrl }))
    .filter((e): e is { title: string; url: string } => Boolean(e.url));
  const noteTopics = noteArticles
    .slice(0, TOPIC_HISTORY_COUNT)
    .map((n) => ({ title: n.title, url: n.link }));
  // 溶けてダシになった(過去の)キャラたちも、現在の面々の会話の話題に
  // 挙がるようにする。新しく溶けた子ほど話題に出やすい(新しい順)。
  const meltedNames = meltedCreatures
    .slice(0, TOPIC_HISTORY_COUNT)
    .map((c) => deriveName(c.poem, c.createdAt));

  return (
    <div className="pot-chat">
      <PotChatModal
        roster={roster}
        topics={{
          episodes: episodeTopics,
          notes: noteTopics,
          hasWaitingQueue: creatures.length > COMFORTABLE_COUNT,
          meltedNames,
        }}
      />
    </div>
  );
}
