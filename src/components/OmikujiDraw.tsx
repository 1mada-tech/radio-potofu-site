"use client";

import { useEffect, useState } from "react";
import type { Episode } from "@/lib/podcast";
import { formatDate } from "@/lib/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function formatNow(date: Date): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const w = WEEKDAYS[date.getDay()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}年${m}月${d}日(${w}) ${hh}:${mm}:${ss}`;
}

export default function OmikujiDraw({
  episodes,
  buttonLabel,
}: {
  episodes: Episode[];
  buttonLabel: string;
}) {
  const [picked, setPicked] = useState<Episode | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const draw = () => {
    if (episodes.length === 0) return;
    const next = episodes[Math.floor(Math.random() * episodes.length)];
    setPicked(next);
  };

  return (
    <div className="omikuji">
      {now && <p className="omikuji__clock">{formatNow(now)}</p>}
      <button type="button" className="omikuji__button" onClick={draw}>
        {buttonLabel}
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
