"use client";

import { useEffect, useRef, useState } from "react";
import type { Episode } from "@/lib/podcast";
import EpisodeTableRow from "@/components/EpisodeTableRow";

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

// スライダーの目盛りを跨いだ時の軽いティック音。値に応じて音程が変わる。
function playSliderTick(ctx: AudioContext, value: number) {
  const freq = 300 + value * 6;
  playTone(ctx, freq, 0.04);
}

// 「ズキューン」的な派手な診断音。ノイズの立ち上がり + 周波数スイープ。
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

function hashPick<T>(list: T[], values: number[]): T {
  let h = 0;
  for (const v of values) {
    h = (h * 31 + Math.round(v)) % 100000;
  }
  const index = ((h % list.length) + list.length) % list.length;
  return list[index];
}

type SliderKey = "fatigue" | "fullness" | "sleepiness";

const SLIDERS: { key: SliderKey; label: string }[] = [
  { key: "fatigue", label: "疲労度" },
  { key: "fullness", label: "満腹度" },
  { key: "sleepiness", label: "眠気度" },
];

export default function PickDraw({
  episodes,
  buttonLabel,
}: {
  episodes: Episode[];
  buttonLabel: string;
}) {
  const [picked, setPicked] = useState<Episode | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [values, setValues] = useState<Record<SliderKey, number>>({
    fatigue: 50,
    fullness: 50,
    sleepiness: 50,
  });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastDecileRef = useRef<Record<SliderKey, number>>({
    fatigue: 5,
    fullness: 5,
    sleepiness: 5,
  });

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
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

  const handleSliderChange = (key: SliderKey, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    const decile = Math.floor(value / 10);
    if (decile !== lastDecileRef.current[key]) {
      lastDecileRef.current[key] = decile;
      const ctx = getCtx();
      if (ctx.state !== "suspended") {
        playSliderTick(ctx, value);
      }
    }
  };

  const draw = () => {
    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume().then(() => playDrawSound(ctx));
    } else {
      playDrawSound(ctx);
    }

    if (episodes.length === 0) return;
    const result = hashPick(episodes, [values.fatigue, values.fullness, values.sleepiness]);
    setPicked(result);
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

      <div className="pick__sliders">
        {SLIDERS.map(({ key, label }) => (
          <label key={key} className="pick__slider">
            <span className="pick__slider-label">
              {label}
              <span className="pick__slider-value">{values[key]}</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={values[key]}
              onChange={(e) => handleSliderChange(key, Number(e.target.value))}
              className="pick__slider-input"
            />
          </label>
        ))}
      </div>

      <button type="button" className="pick__button" onClick={draw}>
        {buttonLabel}
      </button>

      {picked && (
        <div className="pick__result">
          <p className="pick__diagnosis">
            疲労{values.fatigue}・満腹{values.fullness}・眠気{values.sleepiness}の
            あなたにぴったりなのはこちら
          </p>
          <div className="episode-table-wrap">
            <table className="episode-table">
              <tbody>
                <EpisodeTableRow episode={picked} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
