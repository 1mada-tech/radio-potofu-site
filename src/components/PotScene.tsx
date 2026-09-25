"use client";

import { useRef, useState } from "react";
import Creature from "@/components/Creature";
import { derivePosition, deriveName, POT_LIFESPAN_DAYS } from "@/lib/creature";
import { formatDate } from "@/lib/date";
import type { PotCreature } from "@/lib/potCreatures";

function photoDateStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

function elapsedDays(createdAt: string): number {
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  return elapsedMs / (1000 * 60 * 60 * 24);
}

function daysLeft(createdAt: string): number {
  return Math.max(0, Math.ceil(POT_LIFESPAN_DAYS - elapsedDays(createdAt)));
}

// 経過日数(丸め)に応じて1日ごとに一段階ずつ縮んでいく。
// 寿命を迎える頃には半分のサイズになる。
function creatureScale(createdAt: string): number {
  const wholeDays = Math.floor(elapsedDays(createdAt));
  return Math.max(0.5, 1 - 0.5 * (wholeDays / POT_LIFESPAN_DAYS));
}

export default function PotScene({ creatures }: { creatures: PotCreature[] }) {
  const [selected, setSelected] = useState<PotCreature | null>(null);
  const [capturing, setCapturing] = useState(false);
  const potRef = useRef<HTMLDivElement>(null);

  async function handlePhoto() {
    const potEl = potRef.current;
    if (!potEl || capturing) return;
    setCapturing(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const scale = 2;
      const topMargin = 60; // 湯気を描き足すための、鍋の上の余白(CSS px)

      const potRect = potEl.getBoundingClientRect();

      // html2canvasは要素自身の矩形しか捉えられないため、まず鍋本体だけを撮る。
      const potCanvas = await html2canvas(potEl, {
        backgroundColor: "#e4e4e0",
        scale,
      });

      const canvas = document.createElement("canvas");
      canvas.width = potCanvas.width;
      canvas.height = potCanvas.height + topMargin * scale;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#e4e4e0";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(potCanvas, 0, topMargin * scale);

        // 湯気を手描きする(鍋の外にはみ出す部分はhtml2canvasが捉えられないため)。
        const steamWisps: { leftFrac: number; heightFrac: number; topFrac: number; rotateDeg: number }[] = [
          { leftFrac: 150 / 480, heightFrac: 40 / 380, topFrac: -20 / 380, rotateDeg: -8 },
          { leftFrac: 230 / 480, heightFrac: 55 / 380, topFrac: -35 / 380, rotateDeg: 0 },
          { leftFrac: 310 / 480, heightFrac: 40 / 380, topFrac: -20 / 380, rotateDeg: 8 },
        ];
        ctx.save();
        ctx.filter = "blur(6px)";
        ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
        steamWisps.forEach((wisp) => {
          const cx = wisp.leftFrac * potRect.width * scale;
          const cy = topMargin * scale + wisp.topFrac * potRect.height * scale;
          const h = wisp.heightFrac * potRect.height * scale;
          const w = 10 * scale;
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate((wisp.rotateDeg * Math.PI) / 180);
          ctx.beginPath();
          ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
        ctx.restore();

        const stamp = photoDateStamp();
        const fontSize = 22;
        ctx.font = `${fontSize}px sans-serif`;
        const padding = 14;
        const textWidth = ctx.measureText(stamp).width;
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(
          canvas.width - textWidth - padding * 2,
          canvas.height - fontSize - padding * 1.6,
          textWidth + padding * 2,
          fontSize + padding * 0.8
        );
        ctx.fillStyle = "#fff";
        ctx.textBaseline = "middle";
        ctx.fillText(
          stamp,
          canvas.width - textWidth - padding,
          canvas.height - padding
        );
      }
      const link = document.createElement("a");
      link.download = `ポトフ鍋_${photoDateStamp()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="pot-scene">
      <div className="pot" ref={potRef}>
        <span className="pot__steam pot__steam--1" aria-hidden="true" />
        <span className="pot__steam pot__steam--2" aria-hidden="true" />
        <span className="pot__steam pot__steam--3" aria-hidden="true" />

        <div className="pot__ground-shadow" aria-hidden="true" />
        <div className="pot__fire" aria-hidden="true">
          <svg className="pot__flame-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <linearGradient id="pot-flame-outer" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#b81c1c" />
                <stop offset="0.65" stopColor="#f0791b" />
                <stop offset="1" stopColor="#ffce54" />
              </linearGradient>
              <linearGradient id="pot-flame-inner" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#f0791b" />
                <stop offset="0.55" stopColor="#ffce54" />
                <stop offset="1" stopColor="#fff6df" />
              </linearGradient>
            </defs>
            <polygon
              fill="url(#pot-flame-outer)"
              points="50,0 63,14 54,24 72,32 78,54 64,58 72,76 50,100 28,76 36,58 22,54 28,32 46,24 37,14"
            />
            <polygon
              fill="url(#pot-flame-inner)"
              points="50,26 56.76,36.36 52.08,43.76 61.44,49.68 64.56,65.96 57.28,68.92 61.44,82.24 50,100 38.56,82.24 42.72,68.92 35.44,65.96 38.56,49.68 47.92,43.76 43.24,36.36"
            />
          </svg>
        </div>
        <div className="pot__handle pot__handle--left" aria-hidden="true" />
        <div className="pot__handle pot__handle--right" aria-hidden="true" />
        <div className="pot__rim-shadow" aria-hidden="true" />
        <div className="pot__wall" aria-hidden="true" />

        <div className="pot__opening">
          <span className="pot__veg pot__veg--carrot pot__veg--carrot-1" aria-hidden="true" />
          <span className="pot__veg pot__veg--carrot pot__veg--carrot-2" aria-hidden="true" />
          <span className="pot__veg pot__veg--cabbage" aria-hidden="true" />

          {creatures.length === 0 ? (
            <p className="pot__empty">まだ誰も入っていません。最初の一匹を投稿してみませんか？</p>
          ) : (
            creatures.map((creature, i) => {
              const { top, left } = derivePosition(creature.poem, creature.id ?? i);
              return (
                <Creature
                  key={creature.id}
                  poem={creature.poem}
                  top={top}
                  left={left}
                  scale={creatureScale(creature.createdAt)}
                  onClick={() => setSelected(creature)}
                />
              );
            })
          )}
        </div>
      </div>

      <button
        type="button"
        className="pot__photo-button"
        onClick={handlePhoto}
        disabled={capturing}
      >
        {capturing ? "撮影中…" : "記念写真を撮る"}
      </button>

      {selected && (
        <div className="pot__detail" role="dialog" onClick={() => setSelected(null)}>
          <div className="pot__detail-card" onClick={(e) => e.stopPropagation()}>
            <p className="pot__detail-name">{deriveName(selected.poem)}</p>
            <p className="pot__detail-poem">{selected.poem}</p>
            <p className="pot__detail-meta">
              {selected.authorName || "名無し"} ・ {formatDate(selected.createdAt)}
            </p>
            <p className="pot__detail-lifespan">
              あと{daysLeft(selected.createdAt)}日で鍋のダシになります
            </p>
            <button type="button" className="pot__detail-close" onClick={() => setSelected(null)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
