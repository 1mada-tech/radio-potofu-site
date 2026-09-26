"use client";

import { useEffect, useRef, useState } from "react";
import type { SenryuCandidate } from "@/lib/caption";

const SCRAMBLE_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン○●◆■※#&%$@!?";
const SCRAMBLE_FRAME_MS = 45;
const SCRAMBLE_FRAMES = 16;

function randomChar() {
  return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
}

// frameからframeへ、左から確定していくスクランブル文字列を作る。
function scrambleFrame(target: string, frame: number) {
  const resolvedCount = Math.floor((frame / SCRAMBLE_FRAMES) * target.length);
  return Array.from(target)
    .map((ch, i) => (i < resolvedCount ? ch : randomChar()))
    .join("");
}

// versionは数字だけを、ランダム部分と同じフレーム数で左から確定させる。
function scrambleDigits(target: string, frame: number) {
  const resolvedCount = Math.floor((frame / SCRAMBLE_FRAMES) * target.length);
  return Array.from(target)
    .map((ch, i) => (i < resolvedCount ? ch : String(Math.floor(Math.random() * 10))))
    .join("");
}

export default function SenryuHeading({
  candidates,
  initialIndex,
  before,
  after,
  totalVersion,
}: {
  candidates: SenryuCandidate[];
  initialIndex: number;
  before: string;
  after: string;
  totalVersion: string;
}) {
  const [displayWord, setDisplayWord] = useState(candidates[initialIndex]?.word ?? "");
  const [displayVersion, setDisplayVersion] = useState(candidates[initialIndex]?.version ?? "");
  const [scrambling, setScrambling] = useState(false);
  const indexRef = useRef(initialIndex);
  const longestWord = candidates.reduce(
    (longest, c) => (c.word.length > longest.length ? c.word : longest),
    "",
  );

  useEffect(() => {
    if (candidates.length <= 1) return;

    const timer = setInterval(() => {
      let next = Math.floor(Math.random() * candidates.length);
      if (next === indexRef.current) {
        next = (next + 1) % candidates.length;
      }
      indexRef.current = next;
      const target = candidates[next].word;
      const targetVersion = candidates[next].version;

      setScrambling(true);
      let frame = 0;
      const frameTimer = setInterval(() => {
        frame += 1;
        if (frame >= SCRAMBLE_FRAMES) {
          window.clearInterval(frameTimer);
          setDisplayWord(target);
          setDisplayVersion(targetVersion);
          setScrambling(false);
          return;
        }
        setDisplayWord(scrambleFrame(target, frame));
        if (targetVersion) setDisplayVersion(scrambleDigits(targetVersion, frame));
      }, SCRAMBLE_FRAME_MS);
    }, 9000);

    return () => clearInterval(timer);
  }, [candidates]);

  return (
    <>
      <div className="page-heading">
        <h1>
          現代川柳
          {displayVersion && (
            <span
              className={`senryu-caption__version${scrambling ? " senryu-caption__version--scrambling" : ""}`}
            >
              {`version:${displayVersion}${totalVersion ? `/${totalVersion}` : ""}`}
            </span>
          )}
        </h1>
        <p className="page-subtitle">Senryu</p>
      </div>
      <div className="page-caption">
        <p className="senryu-caption__body">
          {before}
          <span
            className={`senryu-caption__word-box${scrambling ? " senryu-caption__word-box--scrambling" : ""}`}
          >
            <span className="senryu-caption__word-sizer" aria-hidden="true">
              {longestWord}
            </span>
            <span className="senryu-caption__word">{displayWord}</span>
          </span>
        </p>
        <p className="senryu-caption__closing">{after.replace(/^[\s　]+/, "")}</p>
      </div>
    </>
  );
}
