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
// 鍋の口(.pot__opening)は480x150のきれいな楕円なので、そこに内接する
// 少し小さめの楕円の内部からランダムに点を選ぶ(矩形の角で楕円からはみ出さないように)。
// 縮めている分(半径)はキャラ本体のサイズ分の余白。
function derivePositionCandidate(poem: string, index: number, attempt: number) {
  const rng = makeRng(hashString(`${poem}::${index}::${attempt}`) || 1);
  const angle = rng() * Math.PI * 2;
  const radius = Math.sqrt(rng()); // 面積が一様になるよう平方根を取る
  const rx = 43; // 横方向の半径(%)
  const ry = 34; // 縦方向の半径(%)
  const top = 50 + Math.sin(angle) * radius * ry;
  const left = 50 + Math.cos(angle) * radius * rx;
  return { top, left };
}

// キャラ本体(66px四方、縦はscaleY(0.72)で表示)が互いに重ならずに済む最小距離。
// 2体がちょうど触れ合う距離は「半径の和」=直径なので、ここには直径を入れる。
// 「具材同士がかぶって見える」のを避けるため、これを下回る距離の候補は
// (他に選択肢がない場合を除いて)採用しない。
const CREATURE_TOP_DIAMETER = 34; // %(.pot__openingの高さ基準。66px*scaleY(0.72)相当+余白)
const CREATURE_LEFT_DIAMETER = 15; // %(.pot__openingの幅基準。66px相当+余白)

function separation(
  a: { top: number; left: number },
  b: { top: number; left: number },
): number {
  // 直径で正規化した距離。1以上なら(円で近似した)本体同士が重ならない。
  return Math.hypot(
    (a.top - b.top) / CREATURE_TOP_DIAMETER,
    (a.left - b.left) / CREATURE_LEFT_DIAMETER,
  );
}

// 鍋にいる全員分の位置をまとめて決める。1体ずつ完全ランダムだと重なりやすいので、
// 候補をたくさん試して、既に置いたキャラと重ならない(separation >= 1)もののうち
// 一番離れているものを選ぶ(決定論的・既存の並び順に依存)。
// 全く重ならない候補が見つからない場合(具材が増えすぎた場合)は、その中で
// 一番マシな(一番離れている)候補にフォールバックする。
export function derivePositions(
  items: { poem: string; index: number }[],
): { top: number; left: number }[] {
  const CANDIDATES = 200;
  const placed: { top: number; left: number }[] = [];

  return items.map(({ poem, index }) => {
    let best = derivePositionCandidate(poem, index, 0);
    let bestScore = -1;

    for (let attempt = 0; attempt < CANDIDATES; attempt++) {
      const candidate = derivePositionCandidate(poem, index, attempt);
      const score =
        placed.length === 0
          ? Infinity
          : Math.min(...placed.map((p) => separation(p, candidate)));
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
      if (bestScore >= 1) break; // 重ならない候補が見つかった時点で十分
    }

    placed.push(best);
    return best;
  });
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
