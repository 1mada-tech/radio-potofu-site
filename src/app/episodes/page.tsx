import { Fragment } from "react";
import type { Metadata } from "next";
import { getEpisodes, EPISODE_EXTRAS_CSV_URL } from "@/lib/podcast";
import { formatDate } from "@/lib/date";
import { getSimpleCaption } from "@/lib/pageCaption";

export const metadata: Metadata = { title: "これまでの配信" };
export const revalidate = 60;

const PER_PAGE = 30;

function renderCaption(text: string) {
  const parts = text.split("タグ");
  return parts.map((part, i) => (
    <Fragment key={i}>
      {part}
      {i < parts.length - 1 && <span className="episode-tag">タグ</span>}
    </Fragment>
  ));
}

export default async function EpisodesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const tagFilter = params.tag || undefined;
  const offset = (page - 1) * PER_PAGE;
  const { contents, totalCount } = await getEpisodes(PER_PAGE, offset, tagFilter);
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const pageHref = (p: number) =>
    tagFilter ? `/episodes?tag=${encodeURIComponent(tagFilter)}&page=${p}` : `/episodes?page=${p}`;
  const caption = await getSimpleCaption(EPISODE_EXTRAS_CSV_URL);

  return (
    <div className="container page">
      <h1>これまでの配信</h1>
      {caption && <p className="page-caption">{renderCaption(caption)}</p>}
      {tagFilter && (
        <p className="episode-filter-notice">
          「#{tagFilter}」で絞り込み中（{totalCount}件）
          <a href="/episodes">絞り込みを解除</a>
        </p>
      )}
      {contents.length > 0 ? (
        <>
          <div className="episode-table-wrap">
            <table className="episode-table">
              <thead>
                <tr>
                  <th>配信開始日</th>
                  <th>タイトル</th>
                  <th>リンク</th>
                </tr>
              </thead>
              <tbody>
                {contents.map((episode) => {
                  const hasTags = Boolean(episode.tags && episode.tags.length > 0);
                  const hasComment = Boolean(episode.comment || episode.recommendation);
                  const tagList = hasTags && (
                    <>
                      {episode.tags?.map((tag) => (
                        <a
                          key={tag}
                          href={`/episodes?tag=${encodeURIComponent(tag)}`}
                          className="episode-tag"
                        >
                          #{tag}
                        </a>
                      ))}
                    </>
                  );
                  return (
                    <Fragment key={episode.id}>
                      <tr
                        className={
                          hasComment ? "episode-table__info-row--with-comment" : undefined
                        }
                      >
                        <td>
                          {formatDate(episode.publishDate)}
                          {hasTags && (
                            <div className="episode-table__tags episode-table__tags--date">
                              {tagList}
                            </div>
                          )}
                        </td>
                        <td>
                          {episode.title}
                          {hasTags && (
                            <div className="episode-table__tags episode-table__tags--title">
                              {tagList}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className="episode-table__links">
                            {episode.spotifyUrl && (
                              <a
                                href={episode.spotifyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Spotify
                              </a>
                            )}
                            {episode.appleUrl && (
                              <a href={episode.appleUrl} target="_blank" rel="noopener noreferrer">
                                Apple Podcast
                              </a>
                            )}
                            {!episode.appleUrl && !episode.spotifyUrl && "-"}
                          </span>
                        </td>
                      </tr>
                      {hasComment && (
                        <tr className="episode-table__comment-row">
                          <td colSpan={3}>
                            <div className="episode-comment">
                              {episode.comment && <span>{episode.comment}</span>}
                              {episode.recommendation && <span>{episode.recommendation}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <nav className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={pageHref(p)}
                  className={
                    p === page
                      ? "pagination__item pagination__item--active"
                      : "pagination__item"
                  }
                >
                  {p}
                </a>
              ))}
            </nav>
          )}
        </>
      ) : (
        <p className="empty-message">
          {tagFilter ? "このタグの回はありません。" : "まだエピソードが登録されていません。"}
        </p>
      )}
    </div>
  );
}
