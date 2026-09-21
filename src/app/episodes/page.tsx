import { Fragment } from "react";
import type { Metadata } from "next";
import { getEpisodes, EPISODE_EXTRAS_CSV_URL } from "@/lib/podcast";
import { getSimpleCaption } from "@/lib/pageCaption";
import Pagination from "@/components/Pagination";
import EpisodeTableRow from "@/components/EpisodeTableRow";

export const metadata: Metadata = { title: "これまでの配信" };
export const revalidate = 60;

const PER_PAGE = 30;
const TOP_TAG_COUNT = 8;

function getTopTags(episodes: { tags?: string[] }[]) {
  const counts = new Map<string, number>();
  for (const episode of episodes) {
    for (const tag of episode.tags ?? []) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_TAG_COUNT)
    .map(([tag]) => tag);
}

// "#" と"♯"(音楽記号のシャープ。見た目が似ているため入力時に混同しやすい)の
// どちらで書かれていても、タグっぽい語(#に続く空白・句読点までの文字列)を
// 実際のタグ表示と同じ見た目でハイライトする。
function renderCaption(text: string) {
  const parts = text.split(/([#♯][^\s、。]+)/g);
  return parts.map((part, i) => {
    const match = part.match(/^[#♯](.+)$/);
    if (match) {
      return (
        <span key={i} className="episode-tag">
          #{match[1]}
        </span>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default async function EpisodesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const tagFilter = params.tag || undefined;
  const query = params.q?.trim() || undefined;
  const offset = (page - 1) * PER_PAGE;

  const [pageResult, allForTags, caption] = await Promise.all([
    query ? getEpisodes(9999, 0, tagFilter) : getEpisodes(PER_PAGE, offset, tagFilter),
    getEpisodes(9999),
    getSimpleCaption(EPISODE_EXTRAS_CSV_URL),
  ]);

  let contents = pageResult.contents;
  let totalCount = pageResult.totalCount;
  if (query) {
    const lowerQuery = query.toLowerCase();
    contents = contents.filter(
      (e) =>
        e.title.toLowerCase().includes(lowerQuery) ||
        e.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)),
    );
    totalCount = contents.length;
  }

  const topTags = getTopTags(allForTags.contents);
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const pageHrefTemplate = tagFilter
    ? `/episodes?tag=${encodeURIComponent(tagFilter)}&page={page}`
    : `/episodes?page={page}`;

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>これまでの配信</h1>
        <p className="page-subtitle">Archive Ptf</p>
      </div>
      {caption && <p className="page-caption">{renderCaption(caption)}</p>}
      <form action="/episodes" method="get" className="episode-search">
        <input
          type="text"
          name="q"
          defaultValue={query ?? ""}
          placeholder="タイトル・タグで検索"
          className="episode-search__input"
        />
        <button type="submit" className="episode-search__button" aria-label="検索">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          >
            <circle cx="7" cy="7" r="5.2" />
            <line x1="11" y1="11" x2="14.5" y2="14.5" />
          </svg>
        </button>
      </form>
      {topTags.length > 0 && (
        <div className="episode-search__tags">
          {topTags.map((tag) => (
            <a
              key={tag}
              href={`/episodes?tag=${encodeURIComponent(tag)}`}
              className="episode-tag"
            >
              #{tag}
            </a>
          ))}
        </div>
      )}
      {tagFilter && (
        <p className="episode-filter-notice">
          「#{tagFilter}」で絞り込み中（{totalCount}件）
          <a href="/episodes">絞り込みを解除</a>
        </p>
      )}
      {query && (
        <p className="episode-filter-notice">
          「{query}」の検索結果（{totalCount}件）
          <a href="/episodes">検索を解除</a>
        </p>
      )}
      {contents.length > 0 ? (
        <>
          {!query && <Pagination page={page} totalPages={totalPages} hrefTemplate={pageHrefTemplate} />}
          <div className="episode-table-wrap">
            <table className="episode-table">
              <thead>
                <tr>
                  <th>配信開始日</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {contents.map((episode) => (
                  <EpisodeTableRow key={episode.id} episode={episode} />
                ))}
              </tbody>
            </table>
          </div>
          {!query && <Pagination page={page} totalPages={totalPages} hrefTemplate={pageHrefTemplate} />}
        </>
      ) : (
        <p className="empty-message">
          {query
            ? "該当する回が見つかりませんでした。"
            : tagFilter
              ? "このタグの回はありません。"
              : "まだエピソードが登録されていません。"}
        </p>
      )}
    </div>
  );
}
