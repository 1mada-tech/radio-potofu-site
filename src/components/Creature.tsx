import { deriveAppearance, deriveName } from "@/lib/creature";

export default function Creature({
  poem,
  top,
  left,
  scale = 1,
  onClick,
}: {
  poem: string;
  top: number;
  left: number;
  scale?: number;
  onClick?: () => void;
}) {
  const appearance = deriveAppearance(poem);
  const name = deriveName(poem);

  return (
    <button
      type="button"
      className="creature"
      style={{
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-50%, -50%) scaleY(0.72) scale(${scale})`,
      }}
      onClick={onClick}
      aria-label={`${name}(${poem})`}
    >
      <span className="creature__name-tag">{name}</span>
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
        <span
          className="creature__antenna"
          style={{ background: appearance.bodyColor }}
        />
      )}
      <span className="creature__eyes">
        <span className={`creature__eye${appearance.eyeType === "sleepy" ? " creature__eye--sleepy" : ""}`} />
        <span className={`creature__eye${appearance.eyeType === "sleepy" ? " creature__eye--sleepy" : ""}`} />
      </span>
      {appearance.mouthType === "smile" && <span className="creature__mouth creature__mouth--smile" />}
      {appearance.mouthType === "o" && <span className="creature__mouth creature__mouth--o" />}
      {appearance.mouthType === "line" && <span className="creature__mouth creature__mouth--line" />}
    </button>
  );
}
