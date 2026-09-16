"use client";

import { useEffect, useRef, useState } from "react";

export default function SenryuCaptionWord({
  initialWord,
  words,
}: {
  initialWord: string;
  words: string[];
}) {
  const [word, setWord] = useState(initialWord);
  const [visible, setVisible] = useState(true);
  const lastWordRef = useRef(initialWord);

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = setInterval(() => {
      setVisible(false);
      window.setTimeout(() => {
        const pool = words.filter((w) => w !== lastWordRef.current);
        const next = pool[Math.floor(Math.random() * pool.length)] ?? lastWordRef.current;
        lastWordRef.current = next;
        setWord(next);
        setVisible(true);
      }, 1400);
    }, 9000);

    return () => clearInterval(timer);
  }, [words]);

  return (
    <span
      className={`senryu-caption__word${visible ? "" : " senryu-caption__word--fading"}`}
    >
      {word}
    </span>
  );
}
