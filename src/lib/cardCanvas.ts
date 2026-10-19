// 鍋カード/鍋内のひとときカードで共通して使うcanvas描画ユーティリティ。

// bodyColorの中には「アクセントソフト」(#fbdcb8)のような淡い色があり、
// そのまま文字色やフッター帯の背景色(白文字用)に使うとコントラスト不足で
// 読みにくくなる。本体の塗りには元の色をそのまま使うが、文字がらみの
// 用途ではこの関数で暗めに補正した色を使う。
export function readableAccent(hex: string): string {
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
export function pathRoundedRect(
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

// CTAバッジをフッター帯から生えた「タブ」のように見せるための、
// 上2角だけ丸めた矩形(下端は直線なので、フッターの上辺と地続きになる)。
export function pathTopRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) {
  const r = Math.min(radius, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// CreatureFace.tsxの本体は、ただの角丸ではなくborder-radiusの8値
// ショートハンド(角ごとに横/縦で別半径の楕円)で、ほぼ円に近い有機的な
// ブロブ形になっている(deriveAppearanceのbodyCorners参照)。これを
// 単純な角丸四角で近似すると、鍋の中・チップでは丸いのにカードだけ
// 四角っぽく見えてしまう。角ごとに楕円弧を使って同じ形を再現する。
export function pathBlobSquare(
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
export function wrapTextChars(
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
