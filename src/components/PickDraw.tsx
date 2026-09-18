"use client";

import { useEffect, useRef, useState } from "react";
import type { Episode } from "@/lib/podcast";
import EpisodeTableRow from "@/components/EpisodeTableRow";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function playTone(ctx: AudioContext, freq: number, duration: number, gain = 0.06) {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.type = "square";
  osc.frequency.value = freq;
  gainNode.gain.setValueAtTime(gain, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

// スライダーの目盛りを跨いだ時の軽いティック音。値に応じて音程が変わる。
function playSliderTick(ctx: AudioContext, value: number) {
  const freq = 300 + value * 6;
  playTone(ctx, freq, 0.04);
}

// 処理中の等間隔ビープ「ピ」。
function playBeep(ctx: AudioContext) {
  playTone(ctx, 880, 0.08, 0.05);
}

// 最後の間に鳴らす長めのビープ「ピー」。
function playLongBeep(ctx: AudioContext) {
  playTone(ctx, 880, 0.45, 0.05);
}

// 結果表示と同時に鳴らす「パシュン！」。ノイズの立ち上がり + 短い下降チャープ。
function playPashun(ctx: AudioContext) {
  const t0 = ctx.currentTime;

  const bufferSize = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.22, t0);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.15);
  noise.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t0);

  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(1200, t0);
  osc.frequency.exponentialRampToValueAtTime(220, t0 + 0.15);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.18);
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

// 診断中に順番に見せるステージ。durationはミリ秒、各ステージの開始時に「ピ」を鳴らす。
const DIAGNOSE_STAGES: { key: SliderKey | null; label: string; duration: number }[] = [
  { key: "fatigue", label: "疲労度を分析中", duration: 450 },
  { key: "fullness", label: "満腹度を照合中", duration: 450 },
  { key: "sleepiness", label: "眠気度を確認中", duration: 450 },
  { key: null, label: "総合診断中", duration: 450 },
];
const FINAL_PAUSE = 550; // 最後の「間」。ここで長めのビープを鳴らす。

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
  const [stageProgress, setStageProgress] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
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
    playPashun(getCtx());
    setPicked(result);
    setDiagnosing(false);
    setFinalizing(false);
  };

  const runStage = (i: number) => {
    setStageIndex(i);
    setStageProgress(0);
    playBeep(getCtx());

    const stage = DIAGNOSE_STAGES[i];
    const startedAt = performance.now();

    const tick = (t: number) => {
      const elapsed = t - startedAt;
      const ratio = Math.min(1, elapsed / stage.duration);
      setStageProgress(Math.floor(ratio * 100));
      if (ratio < 1) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      if (i < DIAGNOSE_STAGES.length - 1) {
        runStage(i + 1);
      } else {
        setFinalizing(true);
        playLongBeep(getCtx());
        timeoutRef.current = window.setTimeout(finish, FINAL_PAUSE);
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
    setFinalizing(false);
    setDiagnosing(true);
    runStage(0);
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

      <button
        type="button"
        className="pick__button"
        onClick={draw}
        disabled={diagnosing}
      >
        {diagnosing ? "診断中…" : buttonLabel}
      </button>

      {diagnosing && (
        <div className="pick__diagnostics">
          {DIAGNOSE_STAGES.map((stage, i) => {
            const state = i < stageIndex ? "done" : i === stageIndex ? "active" : "pending";
            const fill = i < stageIndex ? 100 : i === stageIndex ? stageProgress : 0;
            return (
              <div
                key={stage.label}
                className={`pick__diagnostics-step pick__diagnostics-step--${state}`}
              >
                <span className="pick__diagnostics-label">{stage.label}</span>
                <span className="pick__diagnostics-bar">
                  <span
                    className="pick__diagnostics-bar-fill"
                    style={{ width: `${fill}%` }}
                  />
                </span>
              </div>
            );
          })}
          {finalizing && <p className="pick__diagnostics-final">回答を確定中…</p>}
        </div>
      )}

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
