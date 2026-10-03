import { deriveNameParts, COMFORTABLE_COUNT } from "@/lib/creature";
import { getEpisodes } from "@/lib/podcast";
import { getNoteArticles } from "@/lib/noteFeed";
import type { PotCreature } from "@/lib/potCreatures";
import PotChatModal from "@/components/PotChatModal";

// 「鍋内のひととき」: ボタンを押すと、今鍋の中にいるキャラのアイコン
// 一覧と、その面々の会話(自動生成・文字起こし体)をポップアップで見せる。
// 最新エピソード/note記事のタイトルも、話題として会話に混ぜている。
export default async function PotChat({ creatures }: { creatures: PotCreature[] }) {
  // 鍋の中に実際に見えている面々(待機列は含めない)。
  const inPot = creatures.slice(0, COMFORTABLE_COUNT);
  if (inPot.length === 0) return null;

  const roster = inPot.map((c) => {
    const { base, honorific } = deriveNameParts(c.poem, c.createdAt);
    return { poem: c.poem, name: `${base}${honorific}`, honorific, createdAt: c.createdAt };
  });

  const [{ contents: episodes }, noteArticles] = await Promise.all([
    getEpisodes(1),
    getNoteArticles(),
  ]);
  const latestEpisode = episodes[0];
  const latestNote = noteArticles[0];

  return (
    <div className="pot-chat">
      <PotChatModal
        roster={roster}
        topics={{
          latestEpisodeTitle: latestEpisode?.title,
          latestEpisodeUrl: latestEpisode?.spotifyUrl ?? latestEpisode?.appleUrl,
          latestNoteTitle: latestNote?.title,
          latestNoteUrl: latestNote?.link,
        }}
      />
    </div>
  );
}
