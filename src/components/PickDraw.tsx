"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Episode } from "@/lib/podcast";
import { formatDate } from "@/lib/date";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const ITEM_WIDTH = 220;
const SPEED_PX_PER_SEC = 500;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type ReelEntry = { episode: Episode; bonus: boolean };

function buildReel(episodes: Episode[]): ReelEntry[] {
  const shuffled = shuffle(episodes);
  return shuffled.map((episode) => ({
    episode,
    bonus: Math.random() < 1 / 12,
  }));
}

type Judgement = "PERFECT" | "GOOD" | "MISS";

function judge(deviation: number): Judgement {
  const abs = Math.abs(deviation);
  if (abs < ITEM_WIDTH * 0.08) return "PERFECT";
  if (abs < ITEM_WIDTH * 0.25) return "GOOD";
  return "MISS";
}

function truncateTitle(title: string, max = 16): string {
  return title.length > max ? title.slice(0, max) + "…" : title;
}

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

// 回転スタート音。上昇スイープ。
function playSpinStart(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.setValueAtTime(200, t0);
  osc.frequency.exponentialRampToValueAtTime(700, t0 + 0.15);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.18);
}

// 「ズキューン」的な派手な停止音。ノイズの立ち上がり + 周波数スイープ。
function playStopSound(ctx: AudioContext) {
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

function playJudgementSound(ctx: AudioContext, judgement: Judgement) {
  if (judgement === "PERFECT") {
    playTone(ctx, 1046, 0.1);
    setTimeout(() => {
      if (ctx.state !== "closed") playTone(ctx, 1568, 0.15);
    }, 90);
  } else if (judgement === "GOOD") {
    playTone(ctx, 880, 0.12);
  } else {
    playTone(ctx, 220, 0.15);
  }
}

function playBonusFanfare(ctx: AudioContext) {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      if (ctx.state !== "closed") playTone(ctx, freq, 0.18);
    }, i * 90);
  });
}

type Phase = "idle" | "spinning" | "result";

export default function PickDraw({
  episodes,
  buttonLabel,
}: {
  episodes: Episode[];
  buttonLabel: string;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [picked, setPicked] = useState<Episode | null>(null);
  const [judgement, setJudgement] = useState<Judgement | null>(null);
  const [isBonus, setIsBonus] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const tickMutedRef = useRef(false);

  const reel = useMemo(() => buildReel(episodes), [episodes]);
  const stripRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const lastTsRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const stopTick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".pick__button")) return;
      tickMutedRef.current = true;
      document.removeEventListener("click", stopTick);
    };
    document.addEventListener("click", stopTick);
    return () => document.removeEventListener("click", stopTick);
  }, []);

  useEffect(() => {
    setNow(new Date());

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
      if (audioCtxRef.current && !tickMutedRef.current) {
        playTone(audioCtxRef.current, 1200, 0.03);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getCtx = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      audioCtxRef.current = new AudioContextClass();
    }
    return audioCtxRef.current;
  };

  const applyTransform = () => {
    if (!stripRef.current || !viewportRef.current || reel.length === 0) return;
    const viewportWidth = viewportRef.current.clientWidth;
    const x = viewportWidth / 2 - ITEM_WIDTH / 2 - offsetRef.current;
    stripRef.current.style.transform = `translateX(${x}px)`;
  };

  const tick = (ts: number) => {
    if (lastTsRef.current === null) lastTsRef.current = ts;
    const dt = (ts - lastTsRef.current) / 1000;
    lastTsRef.current = ts;
    offsetRef.current += SPEED_PX_PER_SEC * dt;
    applyTransform();
    rafRef.current = requestAnimationFrame(tick);
  };

  const startSpin = () => {
    if (reel.length === 0) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playSpinStart(ctx));
    } else {
      playSpinStart(ctx);
    }
    setPicked(null);
    setJudgement(null);
    setIsBonus(false);
    setPhase("spinning");
    lastTsRef.current = null;
    rafRef.current = requestAnimationFrame(tick);
  };

  const stopSpin = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;

    const rawIndex = Math.floor(offsetRef.current / ITEM_WIDTH);
    const index = ((rawIndex % reel.length) + reel.length) % reel.length;
    const entry = reel[index];
    const deviation = offsetRef.current - (rawIndex * ITEM_WIDTH + ITEM_WIDTH / 2);
    const result = judge(deviation);

    const ctx = getCtx();
    const playFeedback = () => {
      playStopSound(ctx);
      setTimeout(() => {
        if (entry.bonus) {
          playBonusFanfare(ctx);
        } else {
          playJudgementSound(ctx, result);
        }
      }, 300);
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(playFeedback);
    } else {
      playFeedback();
    }

    setPicked(entry.episode);
    setJudgement(result);
    setIsBonus(entry.bonus);
    setPhase("result");
  };

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const handleButtonClick = () => {
    if (phase === "spinning") {
      stopSpin();
    } else {
      startSpin();
    }
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

      {phase !== "idle" && (
        <div className="pick__reel" ref={viewportRef}>
          <div className="pick__reel-strip" ref={stripRef}>
            {[...reel, ...reel].map((entry, i) => (
              <div
                key={i}
                className={`pick__reel-item${entry.bonus ? " pick__reel-item--bonus" : ""}`}
              >
                {entry.bonus && "★ "}
                {truncateTitle(entry.episode.title)}
              </div>
            ))}
          </div>
          <span className="pick__reel-marker pick__reel-marker--top" aria-hidden="true" />
          <span className="pick__reel-marker pick__reel-marker--bottom" aria-hidden="true" />
        </div>
      )}

      <button type="button" className="pick__button" onClick={handleButtonClick}>
        {phase === "spinning" ? "ここで止める！" : buttonLabel}
      </button>

      {phase === "result" && judgement && (
        <p
          className={`pick__judgement pick__judgement--${isBonus ? "bonus" : judgement.toLowerCase()}`}
        >
          {isBonus ? "★ BONUS! ★" : judgement}
        </p>
      )}

      {phase === "result" && picked && (
        <div className={`pick__result${isBonus ? " pick__result--bonus" : ""}`}>
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
