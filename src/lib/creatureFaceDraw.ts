import type { CreatureAppearance } from "@/lib/creature";
import { pathBlobSquare, pathRoundedRect } from "@/lib/cardCanvas";

// CreatureFace.tsx(CSS)の見た目(66px基準)をcanvasに再現する、鍋カード
// (shareImage.ts)と鍋内のひとときカード(potChatImage.ts)で共通の顔パーツ
// 描画ロジック。背後の座布団・地面の影のような、カードごとに違う装飾は
// 呼び出し側で描く。ここでは耳〜口の「顔そのもの」だけを描く。
export const CREATURE_FACE_BODY_BOX = 66; // CreatureFace.tsxの基準サイズ(px)

export function drawCreatureFaceGlyph(
  ctx: CanvasRenderingContext2D,
  params: {
    cx: number;
    bodyTop: number;
    bodySize: number;
    appearance: CreatureAppearance;
  },
) {
  const { cx, bodyTop: bodyY, bodySize, appearance } = params;
  const scale = bodySize / CREATURE_FACE_BODY_BOX;
  const bodyX = cx - bodySize / 2;

  // 鍋の中にいるときは、.creature__scale-wrap(transform-origin: bottom
  // center)の scaleY(0.72) で縦に少しつぶれた楕円っぽい見た目になる。
  // カードでも同じ見た目にするため、顔のパーツ一式(耳〜口)を描く間だけ
  // 底辺を基準に縦方向だけ縮める。
  const FACE_SQUASH_Y = 0.72;
  const faceBottom = bodyY + bodySize;
  ctx.save();
  ctx.translate(cx, faceBottom);
  ctx.scale(1, FACE_SQUASH_Y);
  ctx.translate(-cx, -faceBottom);

  // 耳・アンテナ(本体より先に描いて、本体の下に少し隠れるようにする)
  ctx.fillStyle = appearance.bodyColor;
  if (appearance.earType === "round" || appearance.earType === "long" || appearance.earType === "small") {
    const h = appearance.earType === "long" ? 29 : appearance.earType === "small" ? 9 : 17;
    const w = appearance.earType === "small" ? 10 : 14;
    const top = appearance.earType === "long" ? -20 : appearance.earType === "small" ? -4 : -8;
    for (const side of [-1, 1] as const) {
      ctx.save();
      const earCx = cx + side * (bodySize / 2 - (8 + w / 2) * scale);
      const earCy = bodyY + (top + h / 2) * scale;
      ctx.translate(earCx, earCy);
      ctx.rotate(((side * 15) / 180) * Math.PI);
      ctx.beginPath();
      ctx.ellipse(0, 0, (w / 2) * scale, (h / 2) * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (appearance.earType === "pointy") {
    for (const side of [-1, 1] as const) {
      ctx.save();
      const earCx = cx + side * (bodySize / 2 - 15 * scale);
      const earCy = bodyY - 0 * scale;
      ctx.translate(earCx, earCy);
      ctx.beginPath();
      ctx.moveTo(0, 17 * scale);
      ctx.lineTo(side * 7 * scale, -8 * scale);
      ctx.lineTo(side * 14 * scale, 10 * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  } else if (appearance.earType === "antenna") {
    ctx.save();
    ctx.strokeStyle = appearance.bodyColor;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(cx, bodyY - 2 * scale);
    ctx.lineTo(cx, bodyY - 14 * scale);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, bodyY - 17 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 本体
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
  ctx.shadowOffsetY = 3 * scale;
  ctx.fillStyle = appearance.bodyColor;
  pathBlobSquare(ctx, bodyX, bodyY, bodySize, appearance.bodyCorners);
  ctx.fill();
  ctx.restore();

  // ほっぺ
  if (appearance.blushType !== "none") {
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = appearance.blushType === "pink" ? "#ff6f91" : "#ff9a4d";
    for (const side of [-1, 1] as const) {
      ctx.beginPath();
      ctx.arc(
        cx + side * (bodySize / 2 - (10 + 3.5) * scale),
        bodyY + (32 + 3.5) * scale,
        3.5 * scale,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  // 目
  const eyeY = bodyY + 27 * scale + (appearance.eyeType === "wide" ? 4.5 * scale : 3 * scale);
  const eyeGap = 11 * scale;
  ctx.fillStyle = "#211a15";
  for (const side of [-1, 1] as const) {
    const eyeCx = cx + (side * eyeGap) / 2 + side * (3 * scale);
    if (appearance.eyeType === "dot") {
      ctx.beginPath();
      ctx.arc(eyeCx, eyeY, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (appearance.eyeType === "wide") {
      ctx.beginPath();
      ctx.arc(eyeCx, eyeY, 4.5 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (appearance.eyeType === "sleepy") {
      pathRoundedRect(ctx, eyeCx - 4 * scale, eyeY - 1.5 * scale, 8 * scale, 3 * scale, 2 * scale);
      ctx.fill();
    } else if (appearance.eyeType === "closed") {
      ctx.save();
      ctx.strokeStyle = "#211a15";
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.arc(eyeCx, eyeY + 1 * scale, 3.5 * scale, Math.PI, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 口
  const mouthY = bodyY + 39 * scale;
  ctx.save();
  ctx.strokeStyle = "#211a15";
  ctx.fillStyle = "#211a15";
  if (appearance.mouthType === "smile") {
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(cx, mouthY, 4 * scale, 0, Math.PI);
    ctx.stroke();
  } else if (appearance.mouthType === "o") {
    ctx.beginPath();
    ctx.arc(cx, mouthY + 2 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.mouthType === "line") {
    pathRoundedRect(ctx, cx - 4 * scale, mouthY, 8 * scale, 3 * scale, 1.5 * scale);
    ctx.fill();
  } else if (appearance.mouthType === "wavy") {
    ctx.lineWidth = 2 * scale;
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.beginPath();
    ctx.moveTo(cx - 5 * scale, mouthY + 2 * scale);
    ctx.lineTo(cx + 5 * scale, mouthY + 2 * scale);
    ctx.stroke();
  } else if (appearance.mouthType === "smirk") {
    ctx.lineWidth = 2 * scale;
    ctx.translate(cx, mouthY + 1.5 * scale);
    ctx.rotate((-8 / 180) * Math.PI);
    ctx.beginPath();
    ctx.arc(0, 0, 3.5 * scale, Math.PI * 0.5, Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore(); // FACE_SQUASH_Yの変形を元に戻す
}
