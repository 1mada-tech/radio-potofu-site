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
  const [index, setIndex] = useState(initialIndex);
  const [displayWord, setDisplayWord] = useState(candidates[initialIndex]?.word ?? "");
  const [scrambling, setScrambling] = useState(false);
  const indexRef = useRef(initialIndex);
  const longestWord = candidates.reduce(
    (longest, c) => (c.word.length > longest.length ? c.word : longest),
    "",
  );
  const current = candidates[index];

  useEffect(() => {
    if (candidates.length <= 1) return;

    const timer = setInterval(() => {
      let next = Math.floor(Math.random() * candidates.length);
      if (next === indexRef.current) {
        next = (next + 1) % candidates.length;
      }
      indexRef.current = next;
      const target = candidates[next].word;

      setScrambling(true);
      let frame = 0;
      const frameTimer = setInterval(() => {
        frame += 1;
        if (frame >= SCRAMBLE_FRAMES) {
          window.clearInterval(frameTimer);
          setDisplayWord(target);
          setIndex(next);
          setScrambling(false);
          return;
        }
        setDisplayWord(scrambleFrame(target, frame));
      }, SCRAMBLE_FRAME_MS);
    }, 9000);

    return () => clearInterval(timer);
  }, [candidates]);

  return (
    <>
      <div className="page-heading">
        <h1>
          現代川柳
          {current?.version && (
            <span key={current.version} className="senryu-caption__version">
              {`version:${current.version}${totalVersion ? `/${totalVersion}` : ""}`}
            </span>
          )}
        </h1>
        <p className="page-subtitle">Senryu</p>
      </div>
      <p className="page-caption">
        {before}
        <span
          className={`senryu-caption__word-box${scrambling ? " senryu-caption__word-box--scrambling" : ""}`}
        >
          <span className="senryu-caption__word-sizer" aria-hidden="true">
            {longestWord}
          </span>
          <span className="senryu-caption__word">{displayWord}</span>
        </span>
        {after}
      </p>
    </>
  );
}
