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

// 診断中に順番に見せるステージ。durationはミリ秒。
// key を持つステージはそのスライダー値まで、持たないステージは100までカウントアップする。
const DIAGNOSE_STAGES: { key: SliderKey | null; label: string; duration: number }[] = [
  { key: "fatigue", label: "疲労度を分析中", duration: 500 },
  { key: "fullness", label: "満腹度を照合中", duration: 500 },
  { key: "sleepiness", label: "眠気度を確認中", duration: 500 },
  { key: null, label: "総合診断中", duration: 600 },
];
const STAGE_GAP = 60; // ステージ間の小さな間

export default function PickDraw({
  episodes,
  buttonLabel,
}: {
  episodes: Episode[];
  buttonLabel: string;
}) {
  const [picked, setPicked] = useState<Episode | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [stageValue, setStageValue] = useState(0);
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
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
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

  const finish = () => {
    const result = hashPick(episodes, [values.fatigue, values.fullness, values.sleepiness]);
    playDrawSound(getCtx());
    setPicked(result);
    setDiagnosing(false);
  };

  const runStage = (i: number) => {
    setStageIndex(i);
    const stage = DIAGNOSE_STAGES[i];
    const target = stage.key ? values[stage.key] : 100;
    const startedAt = performance.now();

    const tick = (t: number) => {
      const elapsed = t - startedAt;
      const ratio = Math.min(1, elapsed / stage.duration);
      setStageValue(Math.floor(target * ratio));
      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (i < DIAGNOSE_STAGES.length - 1) {
        timeoutRef.current = window.setTimeout(() => runStage(i + 1), STAGE_GAP);
      } else {
        finish();
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const draw = () => {
    if (episodes.length === 0 || diagnosing) return;

    const ctx = getCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    setPicked(null);
    setDiagnosing(true);
    setStageValue(0);
    runStage(0);
  };

  return (
    <div className="pick">
      {diagnosing ? (
        <p className="pick__clock pick__clock--diagnosing">
          <span className="pick__clock-line pick__clock-label">
            {DIAGNOSE_STAGES[stageIndex].label}
          </span>
          <span className="pick__clock-line">
            {String(stageValue).padStart(3, "0")}
            <span className="pick__clock-kanji">%</span>
          </span>
        </p>
      ) : (
        now && (
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
        )
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

      <button
        type="button"
        className="pick__button"
        onClick={draw}
        disabled={diagnosing}
      >
        {diagnosing ? "診断中…" : buttonLabel}
      </button>

      {picked && !diagnosing && (
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
