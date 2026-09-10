"use client";

import { useState } from "react";
import type { Episode } from "@/lib/podcast";
import { formatDate } from "@/lib/date";

export default function OmikujiDraw({ episodes }: { episodes: Episode[] }) {
  const [picked, setPicked] = useState<Episode | null>(null);

  const draw = () => {
    if (episodes.length === 0) return;
    const next = episodes[Math.floor(Math.random() * episodes.length)];
    setPicked(next);
  };

  return (
    <div className="omikuji">
      <button type="button" className="omikuji__button" onClick={draw}>
        {picked ? "もう一度引く" : "引く"}
      </button>

      {picked && (
        <div className="omikuji__result">
          <p className="card__date">{formatDate(picked.publishDate)}</p>
          <h3 className="card__title">{picked.title}</h3>
          {(picked.comment || picked.recommendation) && (
            <p className="omikuji__comment">
              {picked.comment}
              {picked.comment && picked.recommendation ? " / " : ""}
              {picked.recommendation}
            </p>
          )}
          {picked.tags && picked.tags.length > 0 && (
            <div className="episode-table__tags">
              {picked.tags.map((tag) => (
                <span key={tag} className="episode-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {(picked.appleUrl || picked.spotifyUrl) && (
            <div className="card__links">
              {picked.spotifyUrl && (
                <a href={picked.spotifyUrl} target="_blank" rel="noopener noreferrer">
                  Spotify
                </a>
              )}
              {picked.appleUrl && (
                <a href={picked.appleUrl} target="_blank" rel="noopener noreferrer">
                  Apple Podcast
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
