import { deriveAppearance, deriveName, hashString, makeRng } from "@/lib/creature";
import { pathRoundedRect, pathTopRoundedRect, readableAccent, wrapTextChars } from "@/lib/cardCanvas";
import { drawCreatureFaceGlyph } from "@/lib/creatureFaceDraw";
import { SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT } from "@/lib/shareImage";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ナベカ「遭遇シーン」のシェアカード描画ロジック。既存の鍋カード(shareImage.ts)の
// 骨格(ポケカ風の枠+ヘッダー+イラストウィンドウ+ステータス+ひとこと+フッター)を
// 流用しつつ、以下を変える:
// - ヘッダーは2匹分の番号・名前を「×」でつなぐ
// - イラストウィンドウには2匹を並べて立たせ、背景を「場面」ごとに変える
// - ヘッダー下には場面名の代わりに2句(元の川柳、A→Bの順)を小さく添える
// - ステータス欄は「出会った日」の1カラムのみ
// - ひとことメッセージは遭遇シーンの文章(手書き)

export type SceneVariant = "waterfall" | "stars" | "nightmarket" | "rain" | "meadow";

export const SCENE_LABELS: Record<SceneVariant, string> = {
  waterfall: "滝見物",
  stars: "天体観測",
  nightmarket: "夜店を探検",
  rain: "雨宿り",
  meadow: "ひなたぼっこ",
};

// ヘッダーに使う、場面ごとの詩的なひと言(「ふたりは○○した」で統一)。
// キャラ名は下のラベルに一本化したため、ヘッダーはこちらに差し替える。
const SCENE_HEADLINES: Record<SceneVariant, string> = {
  waterfall: "ふたりは滝を見た",
  stars: "ふたりは星を見た",
  nightmarket: "ふたりは夜店を歩いた",
  rain: "ふたりは雨宿りをした",
  meadow: "ふたりはひなたぼっこをした",
};

// 場面1: 滝を見に行く。水色の背景に、太く豪快な1本の滝+裾で大きく飛び散る飛沫。
function drawWaterfallScene(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#cfeaf2");
  bg.addColorStop(1, "#9fd3e3");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  const fx = x + w * 0.5;
  const fallBottom = y + h * 0.66;
  const fallHalfWidth = w * 0.19;

  // 滝本体(1本、太く堂々とした帯)
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.68;
  ctx.beginPath();
  ctx.moveTo(fx - fallHalfWidth * 0.55, y);
  const segs = 6;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const wobble = Math.sin(t * Math.PI * 2.2) * 10;
    ctx.lineTo(fx + wobble + fallHalfWidth * (0.55 + t * 0.6), y + (fallBottom - y) * t);
  }
  for (let i = segs; i >= 0; i--) {
    const t = i / segs;
    const wobble = Math.sin(t * Math.PI * 2.2) * 10;
    ctx.lineTo(fx + wobble - fallHalfWidth * (0.55 + t * 0.6), y + (fallBottom - y) * t);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // 滝の中の縦の水流線(勢いを表現するテクスチャ)
  const rng = makeRng(seed);
  ctx.strokeStyle = "#ffffff";
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const t0 = rng() * 0.3;
    const lx = fx + (rng() - 0.5) * fallHalfWidth * 1.6;
    ctx.globalAlpha = 0.35 + rng() * 0.25;
    ctx.lineWidth = 3 + rng() * 3;
    ctx.beginPath();
    ctx.moveTo(lx, y + (fallBottom - y) * t0);
    ctx.lineTo(lx + (rng() - 0.5) * 16, fallBottom - 10);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 落ち口の大きな飛沫(放射状に飛び散る水しぶき)
  const splashCy = fallBottom + 6;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 16; i++) {
    const angle = Math.PI * (0.08 + rng() * 0.84);
    const dist = 40 + rng() * (w * 0.32);
    const px = fx + Math.cos(angle) * dist;
    const py = splashCy - Math.sin(angle) * dist * 0.5;
    const r = 5 + rng() * 11;
    ctx.globalAlpha = 0.35 + rng() * 0.35;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 水面のもや(飛沫の下、画面の裾をしっかり覆う)
  const mistTop = y + h * 0.72;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 7; i++) {
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(x + w * (0.1 + i * 0.14), mistTop + (i % 2) * 22, 120, 40, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// 場面2: 星を見る。濃紺の背景に星を散らし、三日月を添える。
function drawStarsScene(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#1b2240");
  bg.addColorStop(1, "#2d3a63");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  const rng = makeRng(seed);
  ctx.fillStyle = "#fff6d8";
  for (let i = 0; i < 55; i++) {
    const px = x + rng() * w;
    const py = y + rng() * h * 0.86;
    const r = 2.5 + rng() * 5.5;
    ctx.globalAlpha = 0.5 + rng() * 0.5;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
    // 大きめの星には十字の光芒を足して存在感を出す
    if (r > 5.5) {
      ctx.save();
      ctx.strokeStyle = "#fff6d8";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(px - r * 2.4, py);
      ctx.lineTo(px + r * 2.4, py);
      ctx.moveTo(px, py - r * 2.4);
      ctx.lineTo(px, py + r * 2.4);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.globalAlpha = 1;

  // 三日月
  ctx.save();
  ctx.fillStyle = "#fdf1c4";
  ctx.globalAlpha = 0.9;
  const moonCx = x + w * 0.76;
  const moonCy = y + h * 0.22;
  const moonR = 64;
  ctx.beginPath();
  ctx.arc(moonCx, moonCy, moonR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(moonCx + moonR * 0.4, moonCy - moonR * 0.15, moonR * 0.88, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 場面3: 夜店を冒険する。暗めの背景に、提灯の暖色の光をいくつか浮かべる。
function drawNightmarketScene(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#2a1f2e");
  bg.addColorStop(1, "#3c2a2a");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  const rng = makeRng(seed);

  // 紅白幕(画面上端の帯。縦ストライプで紅白を交互に)
  const makuHeight = h * 0.1;
  const makuStripeW = 26;
  ctx.save();
  pathRoundedRect(ctx, x, y, w, makuHeight, 0);
  ctx.clip();
  let mi = 0;
  for (let mx = x; mx < x + w; mx += makuStripeW) {
    ctx.fillStyle = mi % 2 === 0 ? "#c0393b" : "#f4ece0";
    ctx.fillRect(mx, y, makuStripeW, makuHeight);
    mi++;
  }
  ctx.restore();
  // 幕の下端に少し影を落として、たるみのある布らしさを出す
  ctx.save();
  const makuShadow = ctx.createLinearGradient(x, y + makuHeight - 10, x, y + makuHeight + 14);
  makuShadow.addColorStop(0, "rgba(0, 0, 0, 0.25)");
  makuShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = makuShadow;
  ctx.fillRect(x, y + makuHeight - 10, w, 24);
  ctx.restore();

  // 提灯をつないで渡す縄(夜店の通りらしさを出す。幕のすぐ下)
  const ropeY = y + makuHeight + h * 0.05;
  ctx.strokeStyle = "rgba(255, 220, 180, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, ropeY);
  ctx.lineTo(x + w + 10, ropeY);
  ctx.stroke();

  const lanternXs = [0.1, 0.27, 0.44, 0.6, 0.76, 0.92];
  for (const fx of lanternXs) {
    const lx = x + w * fx;
    const ly = y + h * (0.2 + rng() * 0.16);
    const r = 30 + rng() * 10;
    // 光の輪(グロー、ひとまわり大きく)
    const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 3.4);
    glow.addColorStop(0, "rgba(255, 183, 94, 0.65)");
    glow.addColorStop(1, "rgba(255, 183, 94, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(lx, ly, r * 3.4, 0, Math.PI * 2);
    ctx.fill();
    // 提灯本体(丸い提灯+縦線)
    ctx.fillStyle = "#ffb75e";
    ctx.beginPath();
    ctx.ellipse(lx, ly, r, r * 1.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(60, 30, 10, 0.4)";
    ctx.lineWidth = 2;
    for (const dx of [-r * 0.4, 0, r * 0.4]) {
      ctx.beginPath();
      ctx.moveTo(lx + dx, ly - r * 1.1);
      ctx.lineTo(lx + dx, ly + r * 1.1);
      ctx.stroke();
    }
    ctx.strokeStyle = "#8a5a2a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lx, ly - r * 1.5);
    ctx.lineTo(lx, ly - r * 1.22);
    ctx.stroke();
  }
}

// 場面4: 雨宿りする。斜めの雨線と、軒先の屋根のシルエット。
function drawRainScene(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const bg = ctx.createLinearGradient(x, y, x, y + h);
  bg.addColorStop(0, "#7c8a9a");
  bg.addColorStop(1, "#aab5c2");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);

  const rng = makeRng(seed);
  ctx.strokeStyle = "#e9eff4";
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 75; i++) {
    const rx = x + rng() * (w + 120) - 60;
    const ry = y + rng() * h;
    const len = 34 + rng() * 30;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - len * 0.3, ry + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 軒先(ひさし)。壁に沿った横長の張り出しで、屋根の「山」は作らない。
  const wallBottom = y + h * 0.1;
  const eaveTop = wallBottom;
  const eaveBottom = y + h * 0.2;
  const scallops = 10;
  const scallopW = w / scallops;

  // 壁(ひさしの付け根になる上端の帯)
  ctx.fillStyle = "#4a4442";
  ctx.fillRect(x - 10, y, w + 20, wallBottom - y);

  // ひさし本体(フラットな張り出し+前面に日除け布のような縁)
  ctx.fillStyle = "#5a5450";
  ctx.beginPath();
  ctx.moveTo(x - 10, eaveTop);
  ctx.lineTo(x + w + 10, eaveTop);
  ctx.lineTo(x + w + 10, eaveBottom - 10);
  for (let i = scallops; i >= 0; i--) {
    const sx = x + scallopW * i;
    const dip = i % 2 === 0 ? eaveBottom : eaveBottom - 10;
    ctx.lineTo(sx, dip);
  }
  ctx.lineTo(x - 10, eaveBottom - 10);
  ctx.closePath();
  ctx.fill();

  // ひさしを支える控え(斜めの突っかい棒、両端のみ)
  ctx.strokeStyle = "#4a4442";
  ctx.lineWidth = 4;
  for (const side of [-1, 1] as const) {
    const sx = side === -1 ? x + w * 0.08 : x + w * 0.92;
    ctx.beginPath();
    ctx.moveTo(sx, eaveBottom - 6);
    ctx.lineTo(sx, eaveBottom + h * 0.1);
    ctx.stroke();
  }

  // ひさしの縁(スカラップ)から伝う雨垂れ
  ctx.strokeStyle = "#e9eff4";
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2.5;
  for (let i = 1; i < scallops; i += 2) {
    const dripX = x + scallopW * i;
    ctx.beginPath();
    ctx.moveTo(dripX, eaveBottom);
    ctx.lineTo(dripX, eaveBottom + 24);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// 場面6: 原っぱで日向ぼっこする。青空+大きな太陽+雲+緑の原っぱ、という
// 単純なモチーフだけに絞った、昼間らしい明るい場面。
function drawMeadowScene(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  const horizonY = y + h * 0.62;

  // 空(上)
  const sky = ctx.createLinearGradient(x, y, x, y + horizonY - y);
  sky.addColorStop(0, "#8fd3f0");
  sky.addColorStop(1, "#d7f0e6");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, horizonY - y);

  const rng = makeRng(seed);

  // 陽光(太陽そのものの形は描かず、画面外の右上隅を光源にした濃淡だけで表現する)
  const glowCx = x + w * 1.08;
  const glowCy = y - h * 0.1;
  const glow = ctx.createRadialGradient(glowCx, glowCy, 0, glowCx, glowCy, w * 0.86);
  glow.addColorStop(0, "rgba(255, 252, 222, 0.95)");
  glow.addColorStop(0.32, "rgba(255, 241, 186, 0.6)");
  glow.addColorStop(0.65, "rgba(255, 235, 170, 0.2)");
  glow.addColorStop(1, "rgba(255, 235, 170, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, horizonY - y);

  // 雲(大きく丸いかたまりを2〜3個、ほどよく離して配置)
  function drawCloud(cx: number, cy: number, scale: number) {
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.92;
    const puffs: Array<[number, number, number]> = [
      [-0.55, 0.12, 0.5],
      [-0.1, -0.1, 0.62],
      [0.4, 0.05, 0.46],
      [0.05, 0.22, 0.55],
    ];
    for (const [dx, dy, r] of puffs) {
      ctx.beginPath();
      ctx.arc(cx + dx * scale, cy + dy * scale, r * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  drawCloud(x + w * 0.2, y + h * 0.2, 110);
  drawCloud(x + w * 0.52, y + h * 0.12, 80);

  // 原っぱ(下、波打つ稜線で空と区切る)
  ctx.fillStyle = "#79b94f";
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, horizonY);
  const waveCount = 5;
  for (let i = 0; i <= waveCount; i++) {
    const px = x + (w / waveCount) * i;
    const py = horizonY + Math.sin(i * 1.3 + seed * 0.001) * 14;
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();

  // 原っぱの濃淡(奥行きを出す帯)
  ctx.fillStyle = "rgba(255, 255, 255, 0.12)";
  ctx.fillRect(x, horizonY + 10, w, 18);

  // 草むらのシルエット(数を絞った、大きめの塊)
  ctx.fillStyle = "#5e9d3d";
  const tuftCount = 6;
  for (let i = 0; i < tuftCount; i++) {
    const tx = x + w * (0.08 + (i / tuftCount) * 0.9) + (rng() - 0.5) * 20;
    const ty = y + h - 6 - rng() * 10;
    const tw = 34 + rng() * 18;
    const th = 22 + rng() * 10;
    ctx.beginPath();
    ctx.moveTo(tx - tw / 2, ty);
    ctx.quadraticCurveTo(tx - tw * 0.15, ty - th, tx, ty - th * 0.2);
    ctx.quadraticCurveTo(tx + tw * 0.15, ty - th, tx + tw / 2, ty);
    ctx.closePath();
    ctx.fill();
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: SceneVariant,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
) {
  switch (scene) {
    case "waterfall":
      drawWaterfallScene(ctx, x, y, w, h, seed);
      break;
    case "stars":
      drawStarsScene(ctx, x, y, w, h, seed);
      break;
    case "nightmarket":
      drawNightmarketScene(ctx, x, y, w, h, seed);
      break;
    case "rain":
      drawRainScene(ctx, x, y, w, h, seed);
      break;
    case "meadow":
      drawMeadowScene(ctx, x, y, w, h, seed);
      break;
  }
}

export type EncounterCreatureInput = {
  poem: string;
  createdAt?: string;
  honorific?: string;
  entryNumber?: number;
};

export function drawEncounterShareImage(
  canvas: HTMLCanvasElement,
  params: {
    scene: SceneVariant;
    creatureA: EncounterCreatureInput;
    creatureB: EncounterCreatureInput;
    encounterNote: string;
    metAt?: string;
    // 遭遇の通し番号(申請順)。ソロカードの「No.XXX」と同じ見せ方で
    // ヘッダーの見出しに添える。
    entryNumber?: number;
  },
) {
  const W = SHARE_IMAGE_WIDTH;
  // 場面名の1行分だった場所に、代わりに元の川柳+名前を2行(A左寄せ・B右寄せ、
  // 背景帯つき)入れるため、ソロカードより縦に長くする(他の要素は下にスライド
  // するだけで詰まらないよう、イラストウィンドウを削るのではなくカード全体を伸ばす)。
  const H = SHARE_IMAGE_HEIGHT + 145;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const appearanceA = deriveAppearance(params.creatureA.poem, params.creatureA.createdAt);
  const appearanceB = deriveAppearance(params.creatureB.poem, params.creatureB.createdAt);
  const nameA = deriveName(
    params.creatureA.poem,
    params.creatureA.createdAt,
    params.creatureA.honorific,
    params.creatureA.entryNumber,
  );
  const nameB = deriveName(
    params.creatureB.poem,
    params.creatureB.createdAt,
    params.creatureB.honorific,
    params.creatureB.entryNumber,
  );
  const accentColor = readableAccent(appearanceA.bodyColor);

  // --- 背景(カード台紙)と外枠。ソロカードと同じ骨格・寸法。 ---
  ctx.fillStyle = "#efe9da";
  ctx.fillRect(0, 0, W, H);

  const margin = 34;
  const frameRadius = 40;
  ctx.save();
  ctx.fillStyle = appearanceA.bodyColor;
  pathRoundedRect(ctx, margin, margin, W - margin * 2, H - margin * 2, frameRadius);
  ctx.fill();
  ctx.restore();

  const cardPad = 16;
  const cardLeft = margin + cardPad;
  const cardRight = W - margin - cardPad;
  const cardWidth = cardRight - cardLeft;
  const innerTop = margin + cardPad;
  const innerHeight = H - margin * 2 - cardPad * 2;
  ctx.save();
  ctx.fillStyle = "#fbf8f1";
  pathRoundedRect(ctx, cardLeft, innerTop, cardWidth, innerHeight, frameRadius - 10);
  ctx.fill();
  // 何もない真っ白な台紙にならないよう、2匹の体色を淡く対角に染める
  // (左上=A, 右下=B。ベタ塗りの句ピルと呼応させる)
  ctx.clip();
  const bgWash = ctx.createLinearGradient(cardLeft, innerTop, cardRight, innerTop + innerHeight);
  bgWash.addColorStop(0, hexToRgba(appearanceA.bodyColor, 0.16));
  bgWash.addColorStop(0.5, hexToRgba(appearanceA.bodyColor, 0.04));
  bgWash.addColorStop(0.5, hexToRgba(appearanceB.bodyColor, 0.04));
  bgWash.addColorStop(1, hexToRgba(appearanceB.bodyColor, 0.16));
  ctx.fillStyle = bgWash;
  ctx.fillRect(cardLeft, innerTop, cardWidth, innerHeight);
  ctx.restore();

  // --- ヘッダー(場面ごとの詩的なひと言。キャラ名はキャラ下ラベルに一本化したので
  // ここでは名前を繰り返さない。ソロカードと同じく、通し番号があれば見出しの
  // 頭に小さく添える) ---
  const headerY = margin + cardPad + 50;
  const headlineFont = "700 44px 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif";
  const headlineText = SCENE_HEADLINES[params.scene];
  ctx.save();
  ctx.textAlign = "left";
  if (params.entryNumber !== undefined) {
    const cardNoFont = "700 24px 'Noto Sans JP', sans-serif";
    const cardNo = `出会いNo.${String(params.entryNumber).padStart(3, "0")}`;
    ctx.font = cardNoFont;
    const cardNoWidth = ctx.measureText(cardNo).width;
    const gap = 16;
    ctx.font = headlineFont;
    const headlineWidth = ctx.measureText(headlineText).width;
    const totalWidth = cardNoWidth + gap + headlineWidth;
    const startX = W / 2 - totalWidth / 2;
    ctx.font = cardNoFont;
    ctx.fillStyle = "#9a9080";
    ctx.fillText(cardNo, startX, headerY);
    ctx.font = headlineFont;
    ctx.fillStyle = "#211a15";
    ctx.fillText(headlineText, startX + cardNoWidth + gap, headerY);
  } else {
    ctx.textAlign = "center";
    ctx.font = headlineFont;
    ctx.fillStyle = "#211a15";
    ctx.fillText(headlineText, W / 2, headerY);
  }
  ctx.restore();

  // --- 元の川柳+名前(ヘッダーの詩的な言い回しに対して、2匹分の名前と句を添える。
  // タイトルで場面は説明済みのため場面の正式名はここでは繰り返さない。どちらが
  // どちらの句か分かりやすいよう、イラスト欄での立ち位置(A=左/B=右)と揃えて
  // 改行する。
  //
  // 「句から名が生まれた」感は、2つの図形を継ぎ目つきで貼り合わせる(帯の重ね、
  // 矢印の三角)のではなく、1本の帯そのものの色を句側の落ち着いた色から
  // キャラの体色へなだらかに移ろわせることで表す。句の文字の下は色が定まって
  // おらず、名前の文字のところで初めてキャラの色に色づく、という「名付けの
  // 瞬間に色が生まれる」グラデーションにした。 ---
  const poemNameFont = "700 30px 'Noto Sans JP', sans-serif";
  const poemFont = "italic 400 26px 'Noto Sans JP', sans-serif";
  const poemPadX = 40;
  const poemMaxWidth = cardWidth - poemPadX * 2 - 140;
  const pillPadX = 26;
  const innerGap = 32;
  const pillPadY = 14;
  const pillHeight = 30 + pillPadY * 2;
  const poemRowGap = 18;
  const poemRowStep = pillHeight + poemRowGap;
  const poemFirstRowY = headerY + 64;
  const poemBgColor = "#e7dcc3";
  const poemTextColor = "#3a2e22";

  // キャラの体色が乗る側の文字色。淡い体色(肌色系など)は白文字だとコントラスト
  // 不足になるため、明度を見て濃い文字色に切り替える。
  function nameTextColor(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    return L > 0.45 ? "#2a2117" : "#ffffff";
  }

  function drawPoemBlock(
    c: CanvasRenderingContext2D,
    name: string,
    poem: string,
    bodyColor: string,
    align: "left" | "right",
    rowY: number,
    order: "poem-first" | "name-first",
  ) {
    const nameColor = nameTextColor(bodyColor);
    c.font = poemFont;
    const poemLine = wrapTextChars(c, poem, poemMaxWidth, 1)[0] ?? "";
    const poemWidth = c.measureText(poemLine).width;
    c.font = poemNameFont;
    const nameWidth = c.measureText(name).width;

    const totalWidth = pillPadX * 2 + poemWidth + innerGap + nameWidth;
    const startX = align === "left" ? cardLeft + poemPadX : cardRight - poemPadX - totalWidth;
    const pillLeft = startX;
    const pillTop = rowY - pillHeight / 2;

    const poemTextX = order === "poem-first" ? pillLeft + pillPadX : pillLeft + pillPadX + nameWidth + innerGap;
    const nameTextX = order === "poem-first" ? pillLeft + pillPadX + poemWidth + innerGap : pillLeft + pillPadX;

    // 左側テキストの終わりと右側テキストの始まりの間だけ、色がなだらかに移ろう
    const leftTextEnd = order === "poem-first" ? poemTextX + poemWidth : nameTextX + nameWidth;
    const rightTextStart = order === "poem-first" ? nameTextX : poemTextX;
    const fadeFrom = leftTextEnd + innerGap * 0.2;
    const fadeTo = rightTextStart - innerGap * 0.2;
    const leftColor = order === "poem-first" ? poemBgColor : bodyColor;
    const rightColor = order === "poem-first" ? bodyColor : poemBgColor;

    c.save();
    const grad = c.createLinearGradient(pillLeft, 0, pillLeft + totalWidth, 0);
    const toFrac = (x: number) => Math.min(1, Math.max(0, (x - pillLeft) / totalWidth));
    grad.addColorStop(0, leftColor);
    grad.addColorStop(toFrac(fadeFrom), leftColor);
    grad.addColorStop(toFrac(fadeTo), rightColor);
    grad.addColorStop(1, rightColor);
    c.fillStyle = grad;
    pathRoundedRect(c, pillLeft, pillTop, totalWidth, pillHeight, pillHeight / 2);
    c.fill();
    c.restore();

    c.save();
    c.textAlign = "left";
    c.textBaseline = "middle";
    c.font = poemFont;
    c.fillStyle = poemTextColor;
    c.fillText(poemLine, poemTextX, rowY);
    c.font = poemNameFont;
    c.fillStyle = nameColor;
    c.fillText(name, nameTextX, rowY);
    c.restore();
  }

  drawPoemBlock(
    ctx,
    nameA,
    params.creatureA.poem,
    appearanceA.bodyColor,
    "left",
    poemFirstRowY,
    "poem-first",
  );
  drawPoemBlock(
    ctx,
    nameB,
    params.creatureB.poem,
    appearanceB.bodyColor,
    "right",
    poemFirstRowY + poemRowStep,
    "poem-first",
  );

  // --- イラストウィンドウ(場面の背景+2匹を並べて立たせる) ---
  const artX = cardLeft + 28;
  const artY = poemFirstRowY + poemRowStep + pillHeight / 2 + 30;
  const artWidth = cardWidth - 56;
  const artHeight = 534;
  ctx.save();
  pathRoundedRect(ctx, artX, artY, artWidth, artHeight, 24);
  ctx.clip();
  const sceneSeed = hashString(`${params.creatureA.poem}::${params.creatureB.poem}::${params.scene}`) || 1;
  drawScene(ctx, params.scene, artX, artY, artWidth, artHeight, sceneSeed);
  ctx.restore();
  ctx.lineWidth = 5;
  ctx.strokeStyle = appearanceA.bodyColor;
  pathRoundedRect(ctx, artX, artY, artWidth, artHeight, 24);
  ctx.stroke();
  ctx.restore();

  // --- 2匹を並べて立たせる(左右対称の位置、ソロカードより小さめのサイズ) ---
  const bodySize = 224;
  const bodyY = artY + (artHeight - bodySize) / 2 + 36;
  const centerGap = artWidth * 0.26;
  const cxA = artX + artWidth / 2 - centerGap;
  const cxB = artX + artWidth / 2 + centerGap;

  for (const { cx, appearance, name, entryNumber } of [
    { cx: cxA, appearance: appearanceA, name: nameA, entryNumber: params.creatureA.entryNumber },
    { cx: cxB, appearance: appearanceB, name: nameB, entryNumber: params.creatureB.entryNumber },
  ]) {
    // 地面の影
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
    ctx.beginPath();
    ctx.ellipse(cx, bodyY + bodySize + 20, bodySize * 0.32, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawCreatureFaceGlyph(ctx, { cx, bodyTop: bodyY, bodySize, appearance });

    // 名前+番号ラベル(下に添える、小さな白背景のピル。カードの正式な識別情報は
    // ここに一本化し、ヘッダーでは繰り返さない)
    ctx.save();
    ctx.font = "700 22px 'Noto Sans JP', sans-serif";
    ctx.textAlign = "center";
    const labelText = entryNumber !== undefined ? `No.${String(entryNumber).padStart(3, "0")} ${name}` : name;
    const labelY = bodyY + bodySize + 54;
    const labelWidth = ctx.measureText(labelText).width + 28;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    pathRoundedRect(ctx, cx - labelWidth / 2, labelY - 24, labelWidth, 32, 16);
    ctx.fill();
    ctx.fillStyle = "#211a15";
    ctx.fillText(labelText, cx, labelY - 1);
    ctx.restore();
  }

  // --- ステータス行(「出会った日」の1カラムのみ) ---
  const statsTop = artY + artHeight + 36;
  const statsHeight = 96;
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "700 20px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = accentColor;
  ctx.fillText("出会った日", W / 2, statsTop + 28);
  ctx.font = "700 27px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#211a15";
  const metAtText = params.metAt
    ? new Date(params.metAt)
        .toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" })
        .replace(/\//g, ".")
    : "-";
  ctx.fillText(metAtText, W / 2, statsTop + 68);
  ctx.restore();

  // --- 遭遇シーンの本文(ソロカードの「ひとことメッセージ」と同じ体裁、3行) ---
  const artLeftX = artX;
  ctx.font = "400 36px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#4a4136";
  ctx.textAlign = "left";
  const noteLines = wrapTextChars(ctx, params.encounterNote, artWidth, 6);
  const noteTop = statsTop + statsHeight + 32;
  noteLines.forEach((l, i) => {
    ctx.fillText(l, artLeftX, noteTop + i * 47);
  });

  // --- フッター(ソロカードと共通のブランディング) ---
  const footerHeight = 84;
  const footerTop = H - margin - cardPad - footerHeight;

  ctx.save();
  const ctaText = "あなたの川柳からキャラが生まれる";
  ctx.font = "700 24px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "center";
  const ctaTextWidth = ctx.measureText(ctaText).width;
  const ctaPadX = 26;
  const ctaPadY = 14;
  const ctaTabWidth = ctaTextWidth + ctaPadX * 2;
  const ctaTabHeight = 24 + ctaPadY * 2;
  const ctaTabBottom = footerTop + 10;
  const ctaTabTop = ctaTabBottom - ctaTabHeight;
  const ctaTabLeft = cardLeft + 40;
  ctx.fillStyle = accentColor;
  pathTopRoundedRect(ctx, ctaTabLeft, ctaTabTop, ctaTabWidth, ctaTabHeight, ctaTabHeight / 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillText(ctaText, ctaTabLeft + ctaTabWidth / 2, ctaTabTop + ctaPadY + 18);
  ctx.restore();

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
