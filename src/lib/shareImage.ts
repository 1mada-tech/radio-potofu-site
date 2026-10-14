import { deriveAppearance, deriveName } from "@/lib/creature";

// 鍋のキャラをSNSに投稿しやすい正方形画像として書き出すための描画ロジック。
// CreatureFace.tsx(CSS)の見た目(66px基準)を、同じ比率でcanvasに再現する。
// DOMのスクリーンショットではなく値から再構成しているので、どの環境でも
// 同じ画質で安定して出力できる。

export const SHARE_IMAGE_SIZE = 1080;

const BODY_BOX = 66; // CreatureFace.tsxの基準サイズ(px)

// CanvasRenderingContext2D.roundRect()は比較的新しいAPI(Chrome 99+/
// Safari 16+相当)で、古めのモバイルブラウザだと存在せず、呼び出すと
// 例外になってしまう(ボタンを押しても何も起きないように見える不具合の
// 原因になった)。arcToは昔からあるAPIなので、角丸矩形はそちらで描く。
function pathRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// CreatureFace.tsxの本体は、ただの角丸ではなくborder-radiusの8値
// ショートハンド(角ごとに横/縦で別半径の楕円)で、ほぼ円に近い有機的な
// ブロブ形になっている(deriveAppearanceのbodyCorners参照)。これを
// 単純な角丸四角で近似すると、鍋の中・チップでは丸いのにカードだけ
// 四角っぽく見えてしまう。角ごとに楕円弧を使って同じ形を再現する。
function pathBlobSquare(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  corners: { rx1: number; rx2: number; ry1: number; ry2: number },
) {
  const { rx1, rx2, ry1, ry2 } = corners;
  // CSS: border-radius: rx1% rx2% ry2% ry1% / ry1% ry2% rx2% rx1%
  // → 左上(横rx1,縦ry1) 右上(横rx2,縦ry2) 右下(横ry2,縦rx2) 左下(横ry1,縦rx1)
  const tl = { h: (rx1 / 100) * size, v: (ry1 / 100) * size };
  const tr = { h: (rx2 / 100) * size, v: (ry2 / 100) * size };
  const br = { h: (ry2 / 100) * size, v: (rx2 / 100) * size };
  const bl = { h: (ry1 / 100) * size, v: (rx1 / 100) * size };

  ctx.beginPath();
  ctx.moveTo(x + tl.h, y);
  ctx.lineTo(x + size - tr.h, y);
  ctx.ellipse(x + size - tr.h, y + tr.v, tr.h, tr.v, 0, -Math.PI / 2, 0);
  ctx.lineTo(x + size, y + size - br.v);
  ctx.ellipse(x + size - br.h, y + size - br.v, br.h, br.v, 0, 0, Math.PI / 2);
  ctx.lineTo(x + bl.h, y + size);
  ctx.ellipse(x + bl.h, y + size - bl.v, bl.h, bl.v, 0, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + tl.v);
  ctx.ellipse(x + tl.h, y + tl.v, tl.h, tl.v, 0, Math.PI, Math.PI * 1.5);
  ctx.closePath();
}

export function drawCreatureShareImage(
  canvas: HTMLCanvasElement,
  params: { poem: string; createdAt?: string; authorName?: string | null },
) {
  const size = SHARE_IMAGE_SIZE;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const appearance = deriveAppearance(params.poem, params.createdAt);
  const name = deriveName(params.poem, params.createdAt);

  // --- 背景 ---
  ctx.fillStyle = "#e4e4e0";
  ctx.fillRect(0, 0, size, size);

  // --- 顔(本体, 耳, 目, 口, ほっぺ) ---
  const bodySize = 340;
  const scale = bodySize / BODY_BOX;
  const bodyX = (size - bodySize) / 2;
  const bodyY = 150;
  const cx = bodyX + bodySize / 2;

  // 地面の影(キャラが浮いて見えないように)
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.beginPath();
  ctx.ellipse(cx, bodyY + bodySize + 26, bodySize * 0.32, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

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

  // --- テキスト ---
  const textTop = bodyY + bodySize + 70;
  ctx.textAlign = "center";
  ctx.fillStyle = "#211a15";
  ctx.font = "700 56px 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif";
  ctx.fillText(name, size / 2, textTop);

  // 川柳本文(長い場合は折り返す)
  ctx.font = "400 34px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#4a4136";
  const maxWidth = size - 160;
  const words = params.poem.split("");
  let line = "";
  const lines: string[] = [];
  for (const ch of words) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const poemLines = lines.slice(0, 3);
  if (lines.length > 3) {
    poemLines[2] = poemLines[2].slice(0, -1) + "…";
  }
  poemLines.forEach((l, i) => {
    ctx.fillText(l, size / 2, textTop + 56 + i * 46);
  });

  if (params.authorName) {
    ctx.font = "400 26px 'Noto Sans JP', sans-serif";
    ctx.fillStyle = "#6f665a";
    ctx.fillText(
      `投稿: ${params.authorName}`,
      size / 2,
      textTop + 56 + poemLines.length * 46 + 36,
    );
  }

  // --- フッター(ブランディング) ---
  const footerHeight = 90;
  ctx.fillStyle = appearance.bodyColor;
  ctx.fillRect(0, size - footerHeight, size, footerHeight);
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "700 28px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ラジオポトフ 川柳ポトフ鍋", 40, size - footerHeight / 2 + 10);
  ctx.textAlign = "right";
  ctx.font = "400 24px 'Noto Sans JP', sans-serif";
  ctx.fillText("radio-potofu.com/pot", size - 40, size - footerHeight / 2 + 8);
}
