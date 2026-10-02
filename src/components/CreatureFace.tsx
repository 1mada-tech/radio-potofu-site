import { deriveAppearance } from "@/lib/creature";

// キャラの見た目(本体・耳・目・口)だけを描画する部分。
// 鍋の中の本体(Creature.tsx)と、ツールチップ内のミニプレビューの両方から使う。
export default function CreatureFace({ poem }: { poem: string }) {
  const appearance = deriveAppearance(poem);

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
      <span className="creature__eyes">
        <span className={`creature__eye${appearance.eyeType === "sleepy" ? " creature__eye--sleepy" : ""}`} />
        <span className={`creature__eye${appearance.eyeType === "sleepy" ? " creature__eye--sleepy" : ""}`} />
      </span>
      {appearance.mouthType === "smile" && <span className="creature__mouth creature__mouth--smile" />}
      {appearance.mouthType === "o" && <span className="creature__mouth creature__mouth--o" />}
      {appearance.mouthType === "line" && <span className="creature__mouth creature__mouth--line" />}
    </>
  );
}
