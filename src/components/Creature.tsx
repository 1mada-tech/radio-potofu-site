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
          <CreatureFace poem={poem} />
        </span>
      </span>
      <span
        className="creature__name-tag"
        style={labelLevel > 0 ? { top: `${-18 - labelLevel * 14}px` } : undefined}
      >
        {name}
      </span>
    </button>
  );
}
