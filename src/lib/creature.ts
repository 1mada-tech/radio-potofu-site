// 投稿された川柳の文字列から、決定論的に見た目と名前を導出する。
// 見た目データを保存する必要がないよう、毎回この関数で計算し直す。

// 鍋に入ってから溶けて消える(=アーカイブ行き)までの日数。
// クライアントコンポーネントからも参照するため、DB接続を持つ
// lib/potCreatures.tsではなくここに置く。
export const POT_LIFESPAN_DAYS = 5;

const BODY_COLORS = [
  "#f0791b", // にんじん
  "#7fa33e", // キャベツ
  "#d6232e", // 赤いレインジャケット
  "#2e6a63", // 迷彩ジャケットの水色の線
  "#fbdcb8", // アクセントソフト
];

const EAR_TYPES = ["round", "pointy", "antenna", "none"] as const;
const EYE_TYPES = ["dot", "sleepy"] as const;
const MOUTH_TYPES = ["smile", "o", "line"] as const;

export type CreatureAppearance = {
  bodyColor: string;
  bodyRadius: string;
  earType: (typeof EAR_TYPES)[number];
  eyeType: (typeof EYE_TYPES)[number];
  mouthType: (typeof MOUTH_TYPES)[number];
};

function hashString(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 1000000007;
  }
  return h;
}

// hash値を種にした簡易な擬似乱数ジェネレータ(0以上1未満)。
function makeRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function deriveAppearance(poem: string): CreatureAppearance {
  const rng = makeRng(hashString(poem) || 1);
  const bodyColor = BODY_COLORS[Math.floor(rng() * BODY_COLORS.length)];
  const rx1 = 45 + Math.floor(rng() * 15);
  const rx2 = 100 - rx1;
  const ry1 = 45 + Math.floor(rng() * 15);
  const ry2 = 100 - ry1;
  const earType = EAR_TYPES[Math.floor(rng() * EAR_TYPES.length)];
  const eyeType = EYE_TYPES[Math.floor(rng() * EYE_TYPES.length)];
  const mouthType = MOUTH_TYPES[Math.floor(rng() * MOUTH_TYPES.length)];

  return {
    bodyColor,
    bodyRadius: `${rx1}% ${rx2}% ${ry2}% ${ry1}% / ${ry1}% ${ry2}% ${rx2}% ${rx1}%`,
    earType,
    eyeType,
    mouthType,
  };
}

// 鍋の中でのおおよその位置(%)。文字列ごとに決定論的だが散らばって見える。
export function derivePosition(poem: string, index: number) {
  const rng = makeRng(hashString(poem + index) || 1);
  const top = 14 + rng() * 58;
  const left = 12 + rng() * 66;
  return { top, left };
}

// キャラの揺れアニメーションの開始タイミングをずらすための遅延(秒)。
// 全キャラが同時に揺れると不自然なので、文字列ごとにばらけさせる。
export function deriveWiggleDelay(poem: string): number {
  const rng = makeRng(hashString(`${poem}::wiggle`) || 1);
  return rng() * 3;
}

const KATAKANA_RUN = /[ァ-ヶー]{2,}/g;

const HONORIFICS = ["くん", "ちゃん", "にゃん", "先生", "さん", "氏"];

// 川柳の文字列から名前を抜き出す。カタカナの連続部分があればそれを、
// なければ末尾の数文字をフォールバックとして使う。
// さらに、くん/ちゃん/にゃん等の敬称を文字列ごとに決定論的に割り振る。
export function deriveName(poem: string): string {
  const trimmed = poem.trim();
  if (!trimmed) return "なまえなし";

  let base = "";
  const katakanaMatches = trimmed.match(KATAKANA_RUN);
  if (katakanaMatches) {
    const longest = katakanaMatches.reduce((a, b) => (b.length > a.length ? b : a));
    if (longest.length >= 2) base = longest;
  }
  if (!base) {
    const tailLength = Math.min(4, trimmed.length);
    base = trimmed.slice(-tailLength);
  }

  const rng = makeRng(hashString(`${trimmed}::honorific`) || 1);
  const honorific = HONORIFICS[Math.floor(rng() * HONORIFICS.length)];
  return `${base}${honorific}`;
}
