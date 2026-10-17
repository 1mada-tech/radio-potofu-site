import { deriveAppearance, deriveName, hashString, makeRng } from "@/lib/creature";

// 鍋のキャラをSNSに投稿しやすい正方形画像として書き出すための描画ロジック。
// CreatureFace.tsx(CSS)の見た目(66px基準)を、同じ比率でcanvasに再現する。
// DOMのスクリーンショットではなく値から再構成しているので、どの環境でも
// 同じ画質で安定して出力できる。

// トレーディングカードらしい縦長比率(4:5。Instagram等のSNSでも
// フィード内で見切れずに表示できる範囲でできるだけ縦長に寄せている)。
export const SHARE_IMAGE_WIDTH = 1080;
export const SHARE_IMAGE_HEIGHT = 1350;

const BODY_BOX = 66; // CreatureFace.tsxの基準サイズ(px)

// bodyColorの中には「アクセントソフト」(#fbdcb8)のような淡い色があり、
// そのまま文字色やフッター帯の背景色(白文字用)に使うとコントラスト不足で
// 読みにくくなる。本体の塗りには元の色をそのまま使うが、文字がらみの
// 用途ではこの関数で暗めに補正した色を使う。
function readableAccent(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (rr: number, gg: number, bb: number) => {
    const srgb = [rr, gg, bb].map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
  };
  let factor = 1;
  while (luminance(r * factor, g * factor, b * factor) > 0.18 && factor > 0.05) {
    factor -= 0.05;
  }
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${toHex(r * factor)}${toHex(g * factor)}${toHex(b * factor)}`;
}

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

// 行頭に来ると読みにくい約物(閉じ括弧・句読点など)。行頭禁則処理で
// 前の行の末尾に送る。
const LINE_START_FORBIDDEN = new Set([
  "、", "。", "，", "．", "！", "？", "!", "?", "…",
  "」", "』", "）", "】", "〉", "》", "〕", "｝", "］", ")",
]);

// 指定フォント・幅で1文字ずつ詰める折り返し(行頭禁則のみ。ぶら下げ組みは
// しない簡易版)。maxLinesを超えたら最終行を切り詰めて「…」を足す。
function wrapTextChars(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  truncateSuffix = "…",
): string[] {
  let line = "";
  const lines: string[] = [];
  for (const ch of text) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  // 行頭禁則: 約物が行頭に来たら前の行の末尾に送る。
  for (let i = 1; i < lines.length; i++) {
    while (lines[i].length > 0 && LINE_START_FORBIDDEN.has(lines[i][0])) {
      lines[i - 1] += lines[i][0];
      lines[i] = lines[i].slice(1);
    }
  }
  const nonEmpty = lines.filter((l) => l.length > 0);

  const result = nonEmpty.slice(0, maxLines);
  if (nonEmpty.length > maxLines) {
    result[maxLines - 1] = result[maxLines - 1].slice(0, -1) + truncateSuffix;
  }
  return result;
}

// --- イラストウィンドウの背景パターン案(すべて川柳のハッシュから
// 決定論的に生成。手描きイラスト素材が不要で、キャラが増えても
// 追加作業なしに1体ずつ違う背景になる) ---

// 案A: 鍋の泡/湯気っぽい、ふわっとした円をいくつか散らす。
function drawBubblesBG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  seed: number,
) {
  const rng = makeRng(seed);
  const count = 14;
  for (let i = 0; i < count; i++) {
    const r = 16 + rng() * 54;
    const cx = x + rng() * w;
    const cy = y + rng() * h;
    ctx.globalAlpha = 0.16 + rng() * 0.18;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // ふちを少し濃くして、円であることがはっきりわかるようにする
    ctx.globalAlpha = 0.3 + rng() * 0.2;
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 案B: キッチンクロスのような、均等なドット柄。
function drawDotsBG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  const gap = 46;
  const r = 7;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.32;
  for (let row = 0; row * gap < h + gap; row++) {
    const offset = row % 2 === 0 ? 0 : gap / 2;
    for (let col = 0; col * gap + offset < w + gap; col++) {
      ctx.beginPath();
      ctx.arc(x + col * gap + offset, y + row * gap, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

// 案D: 斜めストライプ(2色の帯を交互に)。
function drawStripesBG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  const stripeWidth = 46;
  const diag = Math.hypot(w, h);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((-20 * Math.PI) / 180);
  ctx.fillStyle = color;
  for (let i = -diag; i < diag * 2; i += stripeWidth * 2) {
    ctx.globalAlpha = 0.22;
    ctx.fillRect(i, -diag, stripeWidth, diag * 3);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

// 案E: ギンガムチェック(キッチンクロスの定番柄)。
function drawGinghamBG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) {
  const cell = 54;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.16;
  for (let row = 0; row * cell < h + cell; row++) {
    for (let col = 0; col * cell < w + cell; col++) {
      if ((row + col) % 2 === 0) {
        ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
      }
    }
  }
  ctx.globalAlpha = 0.14;
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  for (let i = 0; i * cell < w + cell; i++) {
    ctx.beginPath();
    ctx.moveTo(x + i * cell, y);
    ctx.lineTo(x + i * cell, y + h);
    ctx.stroke();
  }
  for (let i = 0; i * cell < h + cell; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y + i * cell);
    ctx.lineTo(x + w, y + i * cell);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// --- ここから具象系の案。素材を手描きせず、簡単なパス(円弧・ベジェ曲線)の
// 組み合わせだけで「それらしいシルエット」を表現する(抽象パターンと同じく
// コードだけで完結し、キャラが増えても追加の手作業は発生しない) ---

// にんじんのシルエット(先細りの雫形+葉っぱ2枚)。
function drawCarrotSilhouette(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.1);
  ctx.quadraticCurveTo(size * 0.42, size * 0.05, 0, size * 0.9);
  ctx.quadraticCurveTo(-size * 0.42, size * 0.05, 0, -size * 0.1);
  ctx.fill();
  for (const side of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.08);
    ctx.quadraticCurveTo(side * size * 0.3, -size * 0.28, side * size * 0.08, -size * 0.5);
    ctx.quadraticCurveTo(0, -size * 0.3, 0, -size * 0.08);
    ctx.fill();
  }
}

// 葉っぱ(アーモンド形)のシルエット。
function drawLeafSilhouette(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.quadraticCurveTo(size * 0.45, 0, 0, size * 0.5);
  ctx.quadraticCurveTo(-size * 0.45, 0, 0, -size * 0.5);
  ctx.fill();
}

// きのこ(かさ+軸)のシルエット。
function drawMushroomSilhouette(ctx: CanvasRenderingContext2D, size: number) {
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.42, Math.PI, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.16, 0);
  ctx.lineTo(size * 0.16, 0);
  ctx.lineTo(size * 0.12, size * 0.4);
  ctx.lineTo(-size * 0.12, size * 0.4);
  ctx.closePath();
  ctx.fill();
}

// 案F: 具材(にんじん・葉っぱ・きのこ)のシルエットを散らす。
function drawIngredientsBG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  seed: number,
) {
  const rng = makeRng(seed);
  const shapes = [drawCarrotSilhouette, drawLeafSilhouette, drawMushroomSilhouette];
  const count = 9;
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const shape = shapes[Math.floor(rng() * shapes.length)];
    const size = 46 + rng() * 40;
    const px = x + rng() * w;
    const py = y + rng() * h;
    const angle = rng() * Math.PI * 2;
    ctx.save();
    ctx.globalAlpha = 0.16 + rng() * 0.14;
    ctx.translate(px, py);
    ctx.rotate(angle);
    shape(ctx, size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

// 案G: 鍋の中の情景(下に湯気立つスープの水面、上にふわふわ立ちのぼる湯気)。
function drawPotSceneBG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  seed: number,
) {
  const rng = makeRng(seed);
  // スープの水面(下側、波打つ帯)
  const waterTop = y + h * 0.68;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.14;
  ctx.beginPath();
  ctx.moveTo(x, waterTop);
  const waveCount = 5;
  for (let i = 0; i <= waveCount; i++) {
    const wx = x + (w / waveCount) * i;
    const wy = waterTop + Math.sin(i) * 10;
    ctx.lineTo(wx, wy);
  }
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();

  // 水面に浮かぶ小さな泡
  for (let i = 0; i < 6; i++) {
    ctx.globalAlpha = 0.2 + rng() * 0.15;
    ctx.beginPath();
    ctx.arc(x + rng() * w, waterTop + rng() * (y + h - waterTop), 5 + rng() * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // 湯気(上側、ゆらっとしたS字のストローク)
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const sx = x + w * (0.15 + i * 0.24) + (rng() - 0.5) * 20;
    const sy = y + h * 0.18;
    ctx.globalAlpha = 0.18 + rng() * 0.1;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(sx, sy + 80);
    ctx.bezierCurveTo(sx - 24, sy + 40, sx + 24, sy + 20, sx, sy - 20);
    ctx.bezierCurveTo(sx - 20, sy - 50, sx + 20, sy - 70, sx, sy - 100);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 案C: スープの中の波紋。キャラの位置を中心に同心円を広げる。
function drawRipplesBG(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  centerX: number,
  centerY: number,
) {
  ctx.strokeStyle = color;
  const maxR = Math.hypot(w, h) * 0.6;
  for (let r = 50; r < maxR; r += 50) {
    ctx.globalAlpha = Math.max(0, 0.34 - r / maxR / 4);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

export type BgVariant =
  | "bubbles"
  | "dots"
  | "ripples"
  | "stripes"
  | "gingham"
  | "ingredients"
  | "potscene";

export function drawCreatureShareImage(
  canvas: HTMLCanvasElement,
  params: {
    poem: string;
    createdAt?: string;
    authorName?: string | null;
    // 川柳の作者名(投稿者本人と異なる場合のみ)。指定があれば、カードに
    // 「なべ投入者: ○○」のクレジット行を足す(ステータス欄の「句の作者」は
    // poetNameがあればそちら、なければ投稿者本人を指す)。
    poetName?: string | null;
    entryNumber?: number;
    // 比較検討用の一時的な上書き(/pot/debug-cardsから使用)。本番の呼び出し側は渡さない。
    bgVariantOverride?: BgVariant;
    noteOverride?: string;
  },
) {
  const W = SHARE_IMAGE_WIDTH;
  const H = SHARE_IMAGE_HEIGHT;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const appearance = deriveAppearance(params.poem, params.createdAt);
  const name = deriveName(params.poem, params.createdAt);
  const accentColor = readableAccent(appearance.bodyColor);

  // --- 背景(カード台紙) ---
  ctx.fillStyle = "#efe9da";
  ctx.fillRect(0, 0, W, H);

  // --- カードの外枠(ポケカ等のトレカを参考に、太めの属性カラー枠 + 1枚のカード) ---
  const margin = 34;
  const frameRadius = 40;
  ctx.save();
  ctx.fillStyle = appearance.bodyColor;
  pathRoundedRect(ctx, margin, margin, W - margin * 2, H - margin * 2, frameRadius);
  ctx.fill();
  ctx.restore();

  const cardPad = 16; // 外枠(属性カラー)の太さ
  const cardLeft = margin + cardPad;
  const cardRight = W - margin - cardPad;
  const cardWidth = cardRight - cardLeft;
  ctx.save();
  ctx.fillStyle = "#fbf8f1";
  pathRoundedRect(ctx, cardLeft, margin + cardPad, cardWidth, H - margin * 2 - cardPad * 2, frameRadius - 10);
  ctx.fill();
  ctx.restore();

  // --- ヘッダー(カード番号 + 名前) ---
  const headerY = margin + cardPad + 56;
  ctx.save();
  ctx.textAlign = "left";
  let nameX = cardLeft + 28;
  if (params.entryNumber !== undefined) {
    const cardNo = `No.${String(params.entryNumber).padStart(3, "0")}`;
    ctx.font = "700 22px 'Noto Sans JP', sans-serif";
    ctx.fillStyle = "#9a9080";
    ctx.fillText(cardNo, nameX, headerY);
    nameX += ctx.measureText(cardNo).width + 16;
  }
  ctx.fillStyle = "#211a15";
  ctx.font = "700 46px 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif";
  ctx.fillText(name, nameX, headerY);
  ctx.restore();

  // --- 投入者クレジット(常に表示) ---
  const poetCreditY = headerY + 30;
  ctx.save();
  ctx.textAlign = "left";
  ctx.font = "400 22px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#6f665a";
  ctx.fillText(`なべ投入者: ${params.authorName || "なまえなし"}`, cardLeft + 28, poetCreditY);
  ctx.restore();

  // --- イラストウィンドウ(ポケカの絵柄部分のような、属性カラーで縁取った窓) ---
  // クレジット行の分、artYを下げるのではなくartHeightを縮めて吸収する
  // (下のレイアウトに影響させないため)。
  const artX = cardLeft + 28;
  const artY = headerY + 56;
  const artWidth = cardWidth - 56;
  const artHeight = 534;
  ctx.save();
  ctx.fillStyle = `${appearance.bodyColor}14`;
  pathRoundedRect(ctx, artX, artY, artWidth, artHeight, 24);
  ctx.fill();

  // 背景パターンは7案から川柳ごとに決定論的にランダム選出(1キャラ1パターン固定ではなく、
  // キャラが増えるほど色々な柄が混ざって見えるようにする意図)。
  const BG_VARIANT_POOL: BgVariant[] = [
    "bubbles",
    "dots",
    "ripples",
    "stripes",
    "gingham",
    "ingredients",
    "potscene",
  ];
  const bgPickRng = makeRng(hashString(`${params.poem}::bgpick`) || 1);
  const BG_VARIANT: BgVariant =
    params.bgVariantOverride ?? BG_VARIANT_POOL[Math.floor(bgPickRng() * BG_VARIANT_POOL.length)];
  ctx.save();
  pathRoundedRect(ctx, artX, artY, artWidth, artHeight, 24);
  ctx.clip();
  const bgSeed = hashString(`${params.poem}::bg`) || 1;
  switch (BG_VARIANT) {
    case "bubbles":
      drawBubblesBG(ctx, artX, artY, artWidth, artHeight, appearance.bodyColor, bgSeed);
      break;
    case "dots":
      drawDotsBG(ctx, artX, artY, artWidth, artHeight, appearance.bodyColor);
      break;
    case "ripples":
      drawRipplesBG(
        ctx,
        artX,
        artY,
        artWidth,
        artHeight,
        appearance.bodyColor,
        artX + artWidth / 2,
        artY + artHeight / 2,
      );
      break;
    case "stripes":
      drawStripesBG(ctx, artX, artY, artWidth, artHeight, appearance.bodyColor);
      break;
    case "gingham":
      drawGinghamBG(ctx, artX, artY, artWidth, artHeight, appearance.bodyColor);
      break;
    case "ingredients":
      drawIngredientsBG(ctx, artX, artY, artWidth, artHeight, appearance.bodyColor, bgSeed);
      break;
    case "potscene":
      drawPotSceneBG(ctx, artX, artY, artWidth, artHeight, appearance.bodyColor, bgSeed);
      break;
  }
  ctx.restore();

  ctx.lineWidth = 5;
  ctx.strokeStyle = appearance.bodyColor;
  pathRoundedRect(ctx, artX, artY, artWidth, artHeight, 24);
  ctx.stroke();
  ctx.restore();

  // --- 顔(本体, 耳, 目, 口, ほっぺ) ---
  const bodySize = 300;
  const scale = bodySize / BODY_BOX;
  const cx = artX + artWidth / 2;
  const bodyY = artY + (artHeight - bodySize) / 2 - 18;
  const bodyX = cx - bodySize / 2;
  const badgeCy = bodyY + bodySize / 2 + 10;
  const badgeR = bodySize / 2 + 50;

  // キャラの背後の円形バッジ(ふんわりしたグラデーションの座布団)
  ctx.save();
  const badgeGradient = ctx.createRadialGradient(cx, badgeCy, badgeR * 0.2, cx, badgeCy, badgeR);
  badgeGradient.addColorStop(0, `${appearance.bodyColor}33`);
  badgeGradient.addColorStop(1, `${appearance.bodyColor}00`);
  ctx.fillStyle = badgeGradient;
  ctx.beginPath();
  ctx.arc(cx, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

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

  // --- 川柳本文(攻撃技の説明文のような、フレーバーテキストの枠) ---
  ctx.font = "italic 400 32px 'Noto Sans JP', sans-serif";
  const maxWidth = artWidth - 64;
  const quoted = `「${params.poem}」`;
  const poemLines = wrapTextChars(ctx, quoted, maxWidth, 3, "…」");
  const poemLineHeight = 46;
  const poemPadY = 32;
  const poemBoxTop = artY + artHeight + 26;
  const poemBoxHeight = poemPadY * 2 + poemLines.length * poemLineHeight - 10;
  ctx.save();
  ctx.fillStyle = "rgba(33, 26, 21, 0.03)";
  pathRoundedRect(ctx, artX, poemBoxTop, artWidth, poemBoxHeight, 18);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(33, 26, 21, 0.15)";
  pathRoundedRect(ctx, artX, poemBoxTop, artWidth, poemBoxHeight, 18);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = "#4a4136";
  poemLines.forEach((l, i) => {
    ctx.fillText(l, W / 2, poemBoxTop + poemPadY + 24 + i * poemLineHeight);
  });

  // --- ステータス行(ポケカの弱点/抵抗力/にげるのような3カラム) ---
  const statsTop = poemBoxTop + poemBoxHeight + 36;
  const statsHeight = 96;
  const colWidth = artWidth / 3;
  const statCols: Array<{ label: string; value: string }> = [
    { label: "句の作者", value: params.poetName || params.authorName || "なまえなし" },
    {
      label: "投入日",
      value: params.createdAt
        ? new Date(params.createdAt)
            .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
            .replace(/\//g, ".")
        : "-",
    },
    { label: "状態", value: "鍋の中" },
  ];
  ctx.save();
  ctx.strokeStyle = "rgba(33, 26, 21, 0.15)";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(artX + colWidth * i, statsTop + 10);
    ctx.lineTo(artX + colWidth * i, statsTop + statsHeight - 10);
    ctx.stroke();
  }
  ctx.restore();

  statCols.forEach((col, i) => {
    const colCx = artX + colWidth * i + colWidth / 2;
    ctx.textAlign = "center";
    ctx.font = "700 20px 'Noto Sans JP', sans-serif";
    ctx.fillStyle = accentColor;
    ctx.fillText(col.label, colCx, statsTop + 28);
    ctx.font = "700 27px 'Noto Sans JP', sans-serif";
    ctx.fillStyle = "#211a15";
    ctx.fillText(col.value, colCx, statsTop + 68);
  });

  // --- ひとことメッセージ(ステータス行の下の余白を使う。文面は川柳ごとに手作業/
  // 生成で用意する想定で、比較検討中は/pot/debug-cardsからnoteOverrideで差し替える。
  // 半角英数の単語が行末にかからないよう文章側で調整する前提なので、
  // ここでは単語途中で折れないようにする処理はあえて入れていない) ---
  const noteText =
    params.noteOverride ??
    "鮎を食べたのはこの子かもしれないが聞いてもとぼけてばかりで本当のことはまだ誰も知らないまま今日も鍋の中でとぼけ続けているらしい。";
  ctx.font = "400 36px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#6f665a";
  ctx.textAlign = "left";
  const noteMaxWidth = artWidth;
  const noteLeftX = artX;
  const noteLines = wrapTextChars(ctx, noteText, noteMaxWidth, 3);
  const noteTop = statsTop + statsHeight + 40;
  noteLines.forEach((l, i) => {
    ctx.fillText(l, noteLeftX, noteTop + i * 47);
  });

  // --- フッター(ブランディング。カード下端の丸みに合わせて収める) ---
  const footerHeight = 84;
  const footerTop = H - margin - cardPad - footerHeight;
  ctx.save();
  pathRoundedRect(ctx, cardLeft, margin + cardPad, cardWidth, H - margin * 2 - cardPad * 2, frameRadius - 10);
  ctx.clip();
  ctx.fillStyle = accentColor;
  ctx.fillRect(cardLeft, footerTop, cardWidth, footerHeight);
  ctx.restore();
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.font = "700 28px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("ラジオポトフ公式サイト／川柳ポトフ鍋", cardLeft + 40, footerTop + footerHeight / 2 + 10);
  ctx.textAlign = "right";
  ctx.font = "400 24px 'Noto Sans JP', sans-serif";
  ctx.fillText("radio-potofu.com/pot", cardRight - 40, footerTop + footerHeight / 2 + 8);
}
