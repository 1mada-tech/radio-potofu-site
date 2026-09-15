import { Fragment } from "react";
import type { Episode } from "@/lib/podcast";
import { formatDate } from "@/lib/date";

export default function EpisodeTableRow({ episode }: { episode: Episode }) {
  const hasTags = Boolean(episode.tags && episode.tags.length > 0);
  const hasComment = Boolean(episode.comment || episode.recommendation);
  const tagList = hasTags && (
    <>
      {episode.tags?.map((tag) => (
        <a key={tag} href={`/episodes?tag=${encodeURIComponent(tag)}`} className="episode-tag">
          #{tag}
        </a>
      ))}
    </>
  );

  return (
    <Fragment>
      <tr className={hasComment ? "episode-table__info-row--with-comment" : undefined}>
        <td>
          {formatDate(episode.publishDate)}
          {hasTags && <div className="episode-table__tags episode-table__tags--date">{tagList}</div>}
        </td>
        <td>
          {episode.title}
          {hasTags && <div className="episode-table__tags episode-table__tags--title">{tagList}</div>}
        </td>
        <td>
          <span className="episode-table__links">
            {episode.spotifyUrl && (
              <a href={episode.spotifyUrl} target="_blank" rel="noopener noreferrer">
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
}
