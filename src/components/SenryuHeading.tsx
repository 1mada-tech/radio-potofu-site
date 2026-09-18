"use client";

import { useEffect, useRef, useState } from "react";
import type { SenryuCandidate } from "@/lib/caption";

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
  const [visible, setVisible] = useState(true);
  const indexRef = useRef(initialIndex);
  const longestWord = candidates.reduce(
    (longest, c) => (c.word.length > longest.length ? c.word : longest),
    "",
  );
  const current = candidates[index];

  useEffect(() => {
    if (candidates.length <= 1) return;

    const timer = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        let next = Math.floor(Math.random() * candidates.length);
        if (next === indexRef.current) {
          next = (next + 1) % candidates.length;
        }
        indexRef.current = next;
        setIndex(next);
        setVisible(true);
      }, 1400);
    }, 9000);

    return () => clearInterval(timer);
  }, [candidates.length]);

  return (
    <>
      <div className="page-heading">
        <h1>
          現代川柳
          {current?.version && (
            <span className="senryu-caption__version">
              {`version:${current.version}${totalVersion ? `/${totalVersion}` : ""}`}
            </span>
          )}
        </h1>
        <p className="page-subtitle">Senryu</p>
      </div>
      <p className="page-caption">
        {before}
        <span className="senryu-caption__word-box">
          <span className="senryu-caption__word-sizer" aria-hidden="true">
            {longestWord}
          </span>
          <span
            className={`senryu-caption__word${visible ? "" : " senryu-caption__word--fading"}`}
          >
            {current?.word}
          </span>
        </span>
        {after}
      </p>
    </>
  );
}
