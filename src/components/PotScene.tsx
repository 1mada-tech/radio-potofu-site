"use client";

import { useEffect, useRef, useState } from "react";
import Creature from "@/components/Creature";
import CreatureFace from "@/components/CreatureFace";
import {
  derivePositions,
  deriveLabelLevels,
  deriveName,
  elapsedDays,
  daysLeft,
  POT_LIFESPAN_DAYS,
  CREATURE_TOP_DIAMETER,
  CREATURE_LEFT_DIAMETER,
  COMFORTABLE_COUNT,
} from "@/lib/creature";
import { formatDate } from "@/lib/date";
import type { PotCreature } from "@/lib/potCreatures";

// 経過日数(丸め)に応じて1日ごとに一段階ずつ縮んでいく。
// 寿命を迎える頃には半分のサイズになる。
function creatureScale(createdAt: string): number {
  const wholeDays = Math.floor(elapsedDays(createdAt));
  return Math.max(0.5, 1 - 0.5 * (wholeDays / POT_LIFESPAN_DAYS));
}

// .pot__opening(480x150)に固定位置で配置されている「キャラ以外の具材」
// (にんじん・キャベツ)。CSS側の top/left/width/height と同じ値。
const OPENING_WIDTH = 480;
const OPENING_HEIGHT = 150;
const VEG_ITEMS = [
  { key: "carrot-1", top: 30, left: 40, width: 30, height: 30 },
  { key: "carrot-2", top: 105, left: 70, width: 20, height: 20 },
  { key: "cabbage", top: 95, left: 340, width: 38, height: 26 },
] as const;

// キャラ本体のおおよその半径(px)。derivePositions側のCREATURE_TOP/LEFT_DIAMETERと揃えてある。
const CREATURE_HALF_WIDTH = (CREATURE_LEFT_DIAMETER / 100) * OPENING_WIDTH * 0.5;
const CREATURE_HALF_HEIGHT = (CREATURE_TOP_DIAMETER / 100) * OPENING_HEIGHT * 0.5;

// キャラがこの具材に重なっているかどうか(px同士の楕円近似での当たり判定)。
function isCreatureOverVeg(
  creature: { top: number; left: number },
  veg: (typeof VEG_ITEMS)[number],
): boolean {
  const creaturePx = {
    top: (creature.top / 100) * OPENING_HEIGHT,
    left: (creature.left / 100) * OPENING_WIDTH,
  };
  const vegCenter = {
    top: veg.top + veg.height / 2,
    left: veg.left + veg.width / 2,
  };
  const dx = creaturePx.left - vegCenter.left;
  const dy = creaturePx.top - vegCenter.top;
  const rx = CREATURE_HALF_WIDTH + veg.width / 2;
  const ry = CREATURE_HALF_HEIGHT + veg.height / 2;
  return (dx / rx) ** 2 + (dy / ry) ** 2 < 1;
}

export default function PotScene({
  creatures,
  tooltipLifespanTemplate,
}: {
  creatures: PotCreature[];
  tooltipLifespanTemplate: string;
}) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const potRef = useRef<HTMLDivElement>(null);

  // タップで開いている間、鍋の外側(ページのどこでも)をタップ/クリックしたら
  // 閉じる。.pot-sceneのonClickだけだと、鍋の外の別のセクションをタップ
  // した時に閉じられないため、documentレベルで見ている。
  useEffect(() => {
    if (hoveredId === null) return;
    function handleOutside(event: MouseEvent) {
      if (potRef.current && !potRef.current.contains(event.target as Node)) {
        setHoveredId(null);
      }
    }
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, [hoveredId]);

  // creaturesは古い順(入った順)。鍋が手狭になりすぎないよう、
  // 実際に鍋の中に入れるのは最初のCOMFORTABLE_COUNT匹までとし、
  // それ以降は鍋の横の待機列に並ばせる(先に入った誰かが溶けて空きが
  // 出れば、次の描画で自動的に繰り上がって鍋に入る)。
  const inPot = creatures.slice(0, COMFORTABLE_COUNT);
  const waiting = creatures.slice(COMFORTABLE_COUNT);

  const positions = derivePositions(
    inPot.map((creature, i) => ({ poem: creature.poem, index: creature.id ?? i })),
  );
  const labelLevels = deriveLabelLevels(positions);
  const positioned = inPot.map((creature, i) => ({
    creature,
    labelLevel: labelLevels[i],
    ...positions[i],
  }));
  const hovered = positioned.find((p) => p.creature.id === hoveredId) ?? null;

  const visibleVeg = VEG_ITEMS.filter(
    (veg) => !positioned.some(({ top, left }) => isCreatureOverVeg({ top, left }, veg)),
  );

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
          <span className="pot__ripple pot__ripple--1" aria-hidden="true" />
          <span className="pot__ripple pot__ripple--2" aria-hidden="true" />
          <span className="pot__ripple pot__ripple--3" aria-hidden="true" />
          <span className="pot__ripple pot__ripple--4" aria-hidden="true" />
          {visibleVeg.some((v) => v.key === "carrot-1") && (
            <span className="pot__veg pot__veg--carrot pot__veg--carrot-1" aria-hidden="true" />
          )}
          {visibleVeg.some((v) => v.key === "carrot-2") && (
            <span className="pot__veg pot__veg--carrot pot__veg--carrot-2" aria-hidden="true" />
          )}
          {visibleVeg.some((v) => v.key === "cabbage") && (
            <span className="pot__veg pot__veg--cabbage" aria-hidden="true" />
          )}

          {positioned.length === 0 ? (
            <p className="pot__empty">まだ誰も入っていません。最初の一匹を投稿してみませんか？</p>
          ) : (
            positioned.map(({ creature, top, left, labelLevel }) => (
              <Creature
                key={creature.id}
                poem={creature.poem}
                createdAt={creature.createdAt}
                top={top}
                left={left}
                scale={creatureScale(creature.createdAt)}
                labelLevel={labelLevel}
                onHoverStart={() => setHoveredId(creature.id)}
                onHoverEnd={() => setHoveredId((id) => (id === creature.id ? null : id))}
                // タップ時、先にonHoverStart(onMouseEnter由来)がhoveredIdを
                // セットしてしまっていることがあるため、ここでは常に開く
                // (トグルにすると直後に閉じてしまうことがある)。
                // 閉じるのは外側タップ(.pot-sceneのonClick)に任せる。
                onTap={() => setHoveredId(creature.id)}
              />
            ))
          )}
        </div>

        {hovered && (
          <div
            className="pot__tooltip"
            style={{
              // pot__openingは鍋(480x380)の上部150px分なので、%表示を鍋全体の座標系に変換する。
              top: `${(hovered.top * 150) / 380}%`,
              left: `${hovered.left}%`,
            }}
          >
            <div className="pot__tooltip-head">
              <span className="pot__tooltip-face" aria-hidden="true">
                <CreatureFace poem={hovered.creature.poem} />
              </span>
              <p className="pot__tooltip-name">
                {deriveName(hovered.creature.poem, hovered.creature.createdAt)}
              </p>
            </div>
            <p className="pot__tooltip-poem">{hovered.creature.poem}</p>
            <p className="pot__tooltip-meta">
              {hovered.creature.authorName || "名無し"} ・ {formatDate(hovered.creature.createdAt)}
            </p>
            <p className="pot__tooltip-lifespan">
              {tooltipLifespanTemplate.replace("x日", `${daysLeft(hovered.creature.createdAt)}日`)}
            </p>
          </div>
        )}
      </div>

      {waiting.length > 0 && (
        <div className="pot__queue" aria-label="鍋に入るのを待っているキャラたち">
          <p className="pot__queue-heading">鍋の横で順番待ち中</p>
          <ul className="pot__queue-list">
            {waiting.map((creature) => (
              <li key={creature.id} className="pot__queue-item">
                <span className="pot__queue-face" aria-hidden="true">
                  <CreatureFace poem={creature.poem} />
                </span>
                <span className="pot__queue-name">
                  {deriveName(creature.poem, creature.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
