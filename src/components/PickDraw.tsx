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

// 「ズキューン」的な派手なドロー音。ノイズの立ち上がり + 周波数スイープ。
function playDrawSound(ctx: AudioContext) {
  const t0 = ctx.currentTime;

  const bufferSize = Math.floor(ctx.sampleRate * 0.05);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, t0);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t0);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(180, t0);
  osc.frequency.exponentialRampToValueAtTime(1800, t0 + 0.09);
  osc.frequency.exponentialRampToValueAtTime(60, t0 + 0.42);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.45);
}

export default function PickDraw({
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

    // ページ到達直後の自動再生。ブラウザの自動再生制限により
    // 鳴らない場合もあるが、その場合は黙って何もしない。
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;
      if (ctx.state === "running") {
        playTone(ctx, 1200, 0.03);
      }
    } catch {
      // 何もしない
    }

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
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playDrawSound(ctx));
    } else {
      playDrawSound(ctx);
    }

    if (episodes.length === 0) return;
    const next = episodes[Math.floor(Math.random() * episodes.length)];
    setPicked(next);
  };

  return (
    <div className="pick">
      {now && (
        <p className="pick__clock">
          <span className="pick__clock-line">
            {now.getFullYear()}
            <span className="pick__clock-kanji">年</span>
            {now.getMonth() + 1}
            <span className="pick__clock-kanji">月</span>
            {now.getDate()}
            <span className="pick__clock-kanji">
              日({WEEKDAYS[now.getDay()]})
            </span>
          </span>
          <span className="pick__clock-line">
            {String(now.getHours()).padStart(2, "0")}:
            {String(now.getMinutes()).padStart(2, "0")}:
            {String(now.getSeconds()).padStart(2, "0")}
          </span>
        </p>
      )}
      <button type="button" className="pick__button" onClick={draw}>
        {buttonLabel}
      </button>

      {picked && (
        <div className="pick__result">
          <p className="card__date">{formatDate(picked.publishDate)}</p>
          <h3 className="card__title">{picked.title}</h3>
          {(picked.comment || picked.recommendation) && (
            <p className="pick__comment">
              {picked.comment}
              {picked.comment && picked.recommendation ? " / " : ""}
              {picked.recommendation}
            </p>
          )}
          {picked.tags && picked.tags.length > 0 && (
            <div className="episode-table__tags">
              {picked.tags.map((tag) => (
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
