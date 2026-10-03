import { deriveAppearance } from "@/lib/creature";

// キャラの見た目(本体・耳・目・口)だけを描画する部分。
// 鍋の中の本体(Creature.tsx)と、ツールチップ内のミニプレビューの両方から使う。
export default function CreatureFace({
  poem,
  createdAt,
}: {
  poem: string;
  createdAt?: string;
}) {
  const appearance = deriveAppearance(poem, createdAt);

  return (
    <>
      <span
        className="creature__body"
        style={{ background: appearance.bodyColor, borderRadius: appearance.bodyRadius }}
      />
      {appearance.earType === "round" && (
        <>
          <span
            className="creature__ear creature__ear--left"
            style={{ background: appearance.bodyColor, borderRadius: "50%" }}
          />
          <span
            className="creature__ear creature__ear--right"
            style={{ background: appearance.bodyColor, borderRadius: "50%" }}
          />
        </>
      )}
      {appearance.earType === "pointy" && (
        <>
          <span
            className="creature__ear creature__ear--left"
            style={{ background: appearance.bodyColor, borderRadius: "50% 50% 50% 0" }}
          />
          <span
            className="creature__ear creature__ear--right"
            style={{ background: appearance.bodyColor, borderRadius: "50% 50% 0 50%" }}
          />
        </>
      )}
      {appearance.earType === "antenna" && (
        <span className="creature__antenna" style={{ background: appearance.bodyColor }} />
      )}
      {appearance.earType === "long" && (
        <>
          <span
            className="creature__ear creature__ear--left creature__ear--long"
            style={{ background: appearance.bodyColor, borderRadius: "50%" }}
          />
          <span
            className="creature__ear creature__ear--right creature__ear--long"
            style={{ background: appearance.bodyColor, borderRadius: "50%" }}
          />
        </>
      )}
      {appearance.earType === "small" && (
        <>
          <span
            className="creature__ear creature__ear--left creature__ear--small"
            style={{ background: appearance.bodyColor, borderRadius: "50%" }}
          />
          <span
            className="creature__ear creature__ear--right creature__ear--small"
            style={{ background: appearance.bodyColor, borderRadius: "50%" }}
          />
        </>
      )}
      <span className="creature__eyes">
        <span className={`creature__eye creature__eye--${appearance.eyeType}`} />
        <span className={`creature__eye creature__eye--${appearance.eyeType}`} />
      </span>
      <span className={`creature__mouth creature__mouth--${appearance.mouthType}`} />
    </>
  );
}
