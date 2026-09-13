"use client";

import { useEffect, useRef, useState } from "react";
import type { Episode } from "@/lib/podcast";
import { formatDate } from "@/lib/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function playTone(ctx: AudioContext, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.06, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
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
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
      if (audioCtxRef.current) {
        playTone(audioCtxRef.current, 1200, 0.03);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const draw = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    playTone(audioCtxRef.current, 440, 0.12);

    if (episodes.length === 0) return;
    const next = episodes[Math.floor(Math.random() * episodes.length)];
    setPicked(next);
  };

  return (
    <div className="omikuji">
      {now && (
        <p className="omikuji__clock">
          <span className="omikuji__clock-line">
            {now.getFullYear()}
            <span className="omikuji__clock-kanji">年</span>
            {now.getMonth() + 1}
            <span className="omikuji__clock-kanji">月</span>
            {now.getDate()}
            <span className="omikuji__clock-kanji">
              日({WEEKDAYS[now.getDay()]})
            </span>
          </span>
          <span className="omikuji__clock-line">
            {String(now.getHours()).padStart(2, "0")}:
            {String(now.getMinutes()).padStart(2, "0")}:
            {String(now.getSeconds()).padStart(2, "0")}
          </span>
        </p>
      )}
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
