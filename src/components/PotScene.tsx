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

// html2canvasはCSSのclip-pathを描画できないため、
// 炎の部分だけキャンバス上に手描きし直す(CSS側の多角形定義と一致させる)。
const FLAME_POLYGON: [number, number][] = [
  [50, 0], [63, 14], [54, 24], [72, 32], [78, 54], [64, 58], [72, 76],
  [50, 100], [28, 76], [36, 58], [22, 54], [28, 32], [46, 24], [37, 14],
];

function drawFlameLayer(
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  inset: { top: number; right: number; bottom: number; left: number },
  colorStops: [number, string][]
) {
  const bx = box.x + inset.left * box.w;
  const by = box.y + inset.top * box.h;
  const bw = box.w - (inset.left + inset.right) * box.w;
  const bh = box.h - (inset.top + inset.bottom) * box.h;

  ctx.save();
  ctx.beginPath();
  FLAME_POLYGON.forEach(([px, py], i) => {
    const cx = bx + (px / 100) * bw;
    const cy = by + (py / 100) * bh;
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  });
  ctx.closePath();
  ctx.clip();
  const gradient = ctx.createLinearGradient(0, by + bh, 0, by);
  colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(bx, by, bw, bh);
  ctx.restore();
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
    const fireEl = potEl?.querySelector<HTMLElement>(".pot__fire");
    if (!potEl || !fireEl || capturing) return;
    setCapturing(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const scale = 2;
      const topMargin = 60; // 湯気を描き足すための、鍋の上の余白(CSS px)

      const potRect = potEl.getBoundingClientRect();
      const fireRect = fireEl.getBoundingClientRect();

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

        const fireBox = {
          x: (fireRect.left - potRect.left) * scale,
          y: (fireRect.top - potRect.top) * scale + topMargin * scale,
          w: fireRect.width * scale,
          h: fireRect.height * scale,
        };
        ctx.clearRect(fireBox.x, fireBox.y, fireBox.w, fireBox.h + 4);
        ctx.fillStyle = "#e4e4e0";
        ctx.fillRect(fireBox.x, fireBox.y, fireBox.w, fireBox.h + 4);

        // 消してしまった地面の影を、火のすぐ下だけ描き直す。
        ctx.save();
        ctx.beginPath();
        ctx.rect(fireBox.x, fireBox.y, fireBox.w, fireBox.h + 4);
        ctx.clip();
        ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
        ctx.beginPath();
        ctx.ellipse(
          0.5 * potRect.width * scale,
          topMargin * scale + (357 / 380) * potRect.height * scale,
          (220 / 480) * potRect.width * scale,
          (17 / 380) * potRect.height * scale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
        ctx.restore();

        drawFlameLayer(ctx, fireBox, { top: 0, right: 0, bottom: 0, left: 0 }, [
          [0, "#b81c1c"],
          [0.65, "#f0791b"],
          [1, "#ffce54"],
        ]);
        drawFlameLayer(ctx, fireBox, { top: 0.26, right: 0.24, bottom: 0, left: 0.24 }, [
          [0, "#f0791b"],
          [0.55, "#ffce54"],
          [1, "#fff6df"],
        ]);

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
          <span className="pot__flame pot__flame--outer" />
          <span className="pot__flame pot__flame--inner" />
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
