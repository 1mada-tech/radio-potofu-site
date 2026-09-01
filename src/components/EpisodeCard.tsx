import type { Episode } from "@/lib/podcast";
import { formatDate } from "@/lib/date";

export default function EpisodeCard({ episode }: { episode: Episode }) {
  return (
    <div className="card">
      <div>
        <p className="card__date">{formatDate(episode.publishDate)}</p>
        <h3 className="card__title">{episode.title}</h3>
        {(episode.appleUrl || episode.spotifyUrl) && (
          <div className="card__links">
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
          </div>
        )}
      </div>
    </div>
  );
}
