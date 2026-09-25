"use client";

import { useState } from "react";
import Creature from "@/components/Creature";
import { derivePosition, deriveName, POT_LIFESPAN_DAYS } from "@/lib/creature";
import { formatDate } from "@/lib/date";
import type { PotCreature } from "@/lib/potCreatures";

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

  return (
    <div className="pot-scene">
      <div className="pot">
        <span className="pot__steam pot__steam--1" aria-hidden="true" />
        <span className="pot__steam pot__steam--2" aria-hidden="true" />
        <span className="pot__steam pot__steam--3" aria-hidden="true" />

        <div className="pot__ground-shadow" aria-hidden="true" />
        <div className="pot__fire" aria-hidden="true">
          <span className="pot__flame pot__flame--1" />
          <span className="pot__flame pot__flame--2" />
          <span className="pot__flame pot__flame--3" />
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
