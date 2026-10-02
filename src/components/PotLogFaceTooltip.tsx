"use client";

import { useEffect, useRef, useState } from "react";
import CreatureFace from "@/components/CreatureFace";
import { deriveName, daysLeft } from "@/lib/creature";
import { formatDate } from "@/lib/date";

// 鍋の記録の各行末に出すミニ顔アイコン。PC ではCSSのhoverで
// ツールチップを出せるが、スマホ等タッチ端末にはhoverがないので、
// タップでも開閉できるようにクライアントコンポーネントにしている。
export default function PotLogFaceTooltip({
  poem,
  authorName,
  createdAt,
  tooltipLifespanTemplate,
}: {
  poem: string;
  authorName: string | null;
  createdAt: string;
  tooltipLifespanTemplate: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);

  // 開いている間だけ、外側をタップ/クリックしたら閉じる。
  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className={`pot-log-item__face-wrap${open ? " pot-log-item__face-wrap--open" : ""}`}
      tabIndex={0}
      onClick={() => setOpen((v) => !v)}
    >
      <span className="pot-log-item__face" aria-hidden="true">
        <CreatureFace poem={poem} />
      </span>
      {/* 鍋の中のキャラにマウスオーバーした時と同じ内容のツールチップ。 */}
      <div className="pot__tooltip pot-log-item__tooltip" aria-hidden="true">
        <div className="pot__tooltip-head">
          <span className="pot__tooltip-face" aria-hidden="true">
            <CreatureFace poem={poem} />
          </span>
          <p className="pot__tooltip-name">{deriveName(poem, createdAt)}</p>
        </div>
        <p className="pot__tooltip-poem">{poem}</p>
        <p className="pot__tooltip-meta">
          {authorName || "名無し"} ・ {formatDate(createdAt)}
        </p>
        <p className="pot__tooltip-lifespan">
          {tooltipLifespanTemplate.replace("x日", `${daysLeft(createdAt)}日`)}
        </p>
      </div>
    </span>
  );
}
