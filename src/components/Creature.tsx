import { deriveName, deriveWiggleDelay } from "@/lib/creature";
import CreatureFace from "@/components/CreatureFace";

export default function Creature({
  poem,
  createdAt,
  top,
  left,
  scale = 1,
  labelLevel = 0,
  onHoverStart,
  onHoverEnd,
  onTap,
}: {
  poem: string;
  createdAt?: string;
  top: number;
  left: number;
  scale?: number;
  labelLevel?: number;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  onTap?: () => void;
}) {
  const name = deriveName(poem, createdAt);
  const wiggleDelay = deriveWiggleDelay(poem);

  // 鍋の下の方(手前側、top%が大きい方)のキャラは、頭の上にラベルを出すと
  // さらに奥(上の方)にいる別のキャラの顔を隠してしまう。下の方のキャラ
  // だけ、ラベルを頭の上ではなく顎のあたりに出すことでこれを避ける。
  const labelBelow = top > 50;
  const labelOffsetPx = labelBelow ? 46 + labelLevel * 14 : -18 - labelLevel * 14;

  return (
    <button
      type="button"
      className="creature"
      style={{
        // ここにtransformを置くと(transformを持つ要素は常に新しい重なり文脈を
        // 作ってしまうため)、このキャラの名前ラベルが他のキャラの下に
        // 潜り込んでしまう。位置決めはcalc()で行い、このボタン自体は
        // transformを持たない(=重なり文脈を作らない)ようにしている。
        top: `calc(${top}% - 33px)`,
        left: `calc(${left}% - 33px)`,
      }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={onTap}
      aria-label={`${name}(${poem})`}
    >
      <span className="creature__scale-wrap" style={{ transform: `scaleY(0.72) scale(${scale})` }}>
        <span className="creature__inner" style={{ animationDelay: `${wiggleDelay}s` }}>
          <CreatureFace poem={poem} createdAt={createdAt} />
        </span>
      </span>
      <span className="creature__name-tag" style={{ top: `${labelOffsetPx}px` }}>
        {name}
      </span>
    </button>
  );
}
