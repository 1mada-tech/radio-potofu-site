// 投稿された川柳の文字列から、決定論的に見た目と名前を導出する。
// 見た目データを保存する必要がないよう、毎回この関数で計算し直す。

// 鍋に入ってから溶けて消える(=アーカイブ行き)までの日数。
// クライアントコンポーネントからも参照するため、DB接続を持つ
// lib/potCreatures.tsではなくここに置く。
export const POT_LIFESPAN_DAYS = 5;

export function elapsedDays(createdAt: string): number {
  const elapsedMs = Date.now() - new Date(createdAt).getTime();
  return elapsedMs / (1000 * 60 * 60 * 24);
}

// 鍋のダシになる(完全に溶ける)までの残り日数。既に溶けている場合は0。
export function daysLeft(createdAt: string): number {
  return Math.max(0, Math.ceil(POT_LIFESPAN_DAYS - elapsedDays(createdAt)));
}

const BODY_COLORS = [
  "#f0791b", // にんじん
  "#7fa33e", // キャベツ
  "#d6232e", // 赤いレインジャケット
  "#2e6a63", // 迷彩ジャケットの水色の線
  "#fbdcb8", // アクセントソフト
];

// 見た目のバリエーションを増やした日時。敬称の追加と同じ考え方で、
// これより前に鍋に入ったキャラの見た目が変わらないよう、
// 元のラインナップ(ORIGINAL)と追加後のラインナップ(すべて)を分けている。
const APPEARANCE_EXPANSION_AT = new Date("2026-10-04T00:00:00+09:00").getTime();

const EAR_TYPES_ORIGINAL = ["round", "pointy", "antenna", "none"] as const;
const EAR_TYPES_ADDED = ["long", "small"] as const;
const EAR_TYPES = [...EAR_TYPES_ORIGINAL, ...EAR_TYPES_ADDED];

const EYE_TYPES_ORIGINAL = ["dot", "sleepy"] as const;
const EYE_TYPES_ADDED = ["wide", "closed"] as const;
const EYE_TYPES = [...EYE_TYPES_ORIGINAL, ...EYE_TYPES_ADDED];

const MOUTH_TYPES_ORIGINAL = ["smile", "o", "line"] as const;
const MOUTH_TYPES_ADDED = ["wavy", "smirk"] as const;
const MOUTH_TYPES = [...MOUTH_TYPES_ORIGINAL, ...MOUTH_TYPES_ADDED];

// 見た目の組み合わせ数が少なく、匹数が増えると「全く同じ見た目」が
// 目立って出てしまうため追加した要素。耳・目・口と違って独立した
// 掛け算要因になるよう、既存の4要素とは無関係に選ぶ。
// EXPANSION同様、これより前に鍋に入ったキャラの見た目は変わらないよう
// "none"固定のプールを使う(rng()は消費するが結果は常にnone)。
const BLUSH_EXPANSION_AT = new Date("2026-10-10T00:00:00+09:00").getTime();
const BLUSH_TYPES_ORIGINAL = ["none"] as const;
const BLUSH_TYPES = ["none", "pink", "peach"] as const;

export type CreatureAppearance = {
  bodyColor: string;
  bodyRadius: string;
  earType: (typeof EAR_TYPES)[number];
  eyeType: (typeof EYE_TYPES)[number];
  mouthType: (typeof MOUTH_TYPES)[number];
  blushType: (typeof BLUSH_TYPES)[number];
};

export function hashString(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) % 1000000007;
  }
  return h;
}

// hash値を種にした簡易な擬似乱数ジェネレータ(0以上1未満)。
export function makeRng(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

// createdAtを渡すと、見た目バリエーション追加より前に入ったキャラは
// 元のラインナップから選ぶ(追加後にプールが変わっても、投入時の見た目が
// 変わらないようにするため)。
export function deriveAppearance(poem: string, createdAt?: string): CreatureAppearance {
  const rng = makeRng(hashString(poem) || 1);
  const isBeforeExpansion =
    createdAt !== undefined && new Date(createdAt).getTime() < APPEARANCE_EXPANSION_AT;
  const earPool = isBeforeExpansion ? EAR_TYPES_ORIGINAL : EAR_TYPES;
  const eyePool = isBeforeExpansion ? EYE_TYPES_ORIGINAL : EYE_TYPES;
  const mouthPool = isBeforeExpansion ? MOUTH_TYPES_ORIGINAL : MOUTH_TYPES;
  const isBeforeBlush =
    createdAt !== undefined && new Date(createdAt).getTime() < BLUSH_EXPANSION_AT;
  const blushPool = isBeforeBlush ? BLUSH_TYPES_ORIGINAL : BLUSH_TYPES;

  const bodyColor = BODY_COLORS[Math.floor(rng() * BODY_COLORS.length)];
  const rx1 = 45 + Math.floor(rng() * 15);
  const rx2 = 100 - rx1;
  const ry1 = 45 + Math.floor(rng() * 15);
  const ry2 = 100 - ry1;
  const earType = earPool[Math.floor(rng() * earPool.length)];
  const eyeType = eyePool[Math.floor(rng() * eyePool.length)];
  const mouthType = mouthPool[Math.floor(rng() * mouthPool.length)];
  // 既存4要素のどの選択結果とも無関係な、独立した掛け算要因として
  // 一番最後に引く(既存キャラの耳・目・口の抽選結果に影響しないよう、
  // これより前の抽選順序は変えない)。
  const blushType = blushPool[Math.floor(rng() * blushPool.length)];

  return {
    bodyColor,
    bodyRadius: `${rx1}% ${rx2}% ${ry2}% ${ry1}% / ${ry1}% ${ry2}% ${rx2}% ${rx1}%`,
    earType,
    eyeType,
    mouthType,
    blushType,
  };
}

// 鍋の中でのおおよその位置(%)。文字列ごとに決定論的だが散らばって見える。
// 鍋の口(.pot__opening)は480x150のきれいな楕円なので、そこに内接する
// 少し小さめの楕円の内部からランダムに点を選ぶ(矩形の角で楕円からはみ出さないように)。
// 縮めている分(半径)はキャラ本体のサイズ分の余白。
// 手前側(top%が大きい方)は鍋の立体感を出す濃い茶色の縁(.pot__rim-shadowや
// グラデーションの暗い部分、top 60%あたりから始まる)と被ると不自然なので、
// 縦方向の半径を手前側だけ小さくして、その帯には入らないようにしている。
function derivePositionCandidate(
  poem: string,
  index: number,
  attempt: number,
  salt: number,
) {
  const rng = makeRng(hashString(`${poem}::${index}::${attempt}::${salt}`) || 1);
  const angle = rng() * Math.PI * 2;
  const radius = Math.sqrt(rng()); // 面積が一様になるよう平方根を取る
  const rx = 42; // 横方向の半径(%)
  const ryBack = 32; // 奥側(top%が小さい方)の縦方向の半径(%)
  const ryFront = 8; // 手前側(top%が大きい方)の縦方向の半径(%)。縁を避けるため小さめ
  const sin = Math.sin(angle);
  const ry = sin >= 0 ? ryFront : ryBack;
  const top = 50 + sin * radius * ry;
  const left = 50 + Math.cos(angle) * radius * rx;
  return { top, left };
}

// キャラ本体(66px四方、縦はscaleY(0.72)で表示)が互いに重ならずに済む最小距離。
// 2体がちょうど触れ合う距離は「半径の和」=直径なので、ここには直径を入れる。
// 「具材同士がかぶって見える」のを避けるため、これを下回る距離の候補は
// (他に選択肢がない場合を除いて)採用しない。
// PotScene側(野菜との当たり判定)からも使うため公開している。
export const CREATURE_TOP_DIAMETER = 34; // %(.pot__openingの高さ基準。66px*scaleY(0.72)相当+余白)
export const CREATURE_LEFT_DIAMETER = 15; // %(.pot__openingの幅基準。66px相当+余白)

// 匹数が増えて鍋が手狭になってきたとき、「重ならない」を優先するために
// 要求する間隔そのものを少しずつ縮める。あまり小さくしすぎても見た目が
// おかしいので下限(本来の60%)は設ける。
const MIN_DIAMETER_SCALE = 0.6;
// この匹数を超えたあたりから間隔を縮め始める目安(鍋の広さから逆算した感覚値)。
// 鍋に実際に入れる匹数の上限としても使う(これを超えた分は待機列へ)。
export const COMFORTABLE_COUNT = 9;

function separation(
  a: { top: number; left: number },
  b: { top: number; left: number },
  diameterScale: number,
): number {
  // 直径で正規化した距離。1以上なら(円で近似した)本体同士が重ならない。
  return Math.hypot(
    (a.top - b.top) / (CREATURE_TOP_DIAMETER * diameterScale),
    (a.left - b.left) / (CREATURE_LEFT_DIAMETER * diameterScale),
  );
}

type Point = { top: number; left: number };

// 1つの「全体配置パターン」(salt)について、1体ずつ順番に置いていく。
// 候補をたくさん試して、既に置いたキャラと重ならない(separation >= 1)もののうち
// 一番離れているものを選ぶ(決定論的・既存の並び順に依存)。
function layoutForSalt(
  items: { poem: string; index: number }[],
  salt: number,
  diameterScale: number,
): (Point & { score: number })[] {
  const CANDIDATES = 150;
  const placed: Point[] = [];
  const result: (Point & { score: number })[] = [];

  for (const { poem, index } of items) {
    let best = derivePositionCandidate(poem, index, 0, salt);
    let bestScore = placed.length === 0 ? Infinity : -1;

    for (let attempt = 0; attempt < CANDIDATES; attempt++) {
      const candidate = derivePositionCandidate(poem, index, attempt, salt);
      const score =
        placed.length === 0
          ? Infinity
          : Math.min(...placed.map((p) => separation(p, candidate, diameterScale)));
      if (score > bestScore) {
        bestScore = score;
        best = candidate;
      }
      if (bestScore >= 1) break; // 重ならない候補が見つかった時点で十分
    }

    placed.push(best);
    result.push({ ...best, score: bestScore });
  }

  return result;
}

// 鍋にいる全員分の位置をまとめて決める。1パターンの順番通りの配置だと、
// 最初の方のキャラの位置次第で後のキャラが無駄に窮屈になることがあるので、
// 配置パターンそのもの(salt)を何通りか試し、一番重なりが少ない
// (一番「最悪のペアの離れ具合」が大きい)パターンを採用する(決定論的)。
// それでも全く重ならないパターンが見つからない場合は、その中で一番マシな
// パターンにフォールバックする。
export function derivePositions(
  items: { poem: string; index: number }[],
): Point[] {
  const SALTS = 24;
  const diameterScale = Math.max(
    MIN_DIAMETER_SCALE,
    Math.min(1, COMFORTABLE_COUNT / Math.max(1, items.length)),
  );

  let bestLayout: (Point & { score: number })[] | null = null;
  let bestWorstScore = -Infinity;

  for (let salt = 0; salt < SALTS; salt++) {
    const layout = layoutForSalt(items, salt, diameterScale);
    const worstScore = Math.min(...layout.map((p) => p.score), Infinity);
    if (worstScore > bestWorstScore) {
      bestWorstScore = worstScore;
      bestLayout = layout;
    }
    if (bestWorstScore >= 1) break; // 全員重ならないパターンが見つかった時点で十分
  }

  return bestLayout ?? [];
}

// 名前ラベルは各キャラの頭の真上、同じ高さ(top:-18px)に出るので、
// 左右が近い2体はラベル同士が重なって読めなくなることがある。
// 近いキャラ同士には段違いの「段(level)」を割り振り、呼び出し側で
// 段が上がるほどラベルを上に逃がして重なりを避けられるようにする。
const LABEL_LEFT_THRESHOLD = 24; // %(この距離より近いとラベルが重なりうる)
const LABEL_TOP_THRESHOLD = 14; // %(この距離より近いとラベルが重なりうる)

export function deriveLabelLevels(positions: Point[]): number[] {
  const levels: number[] = [];

  positions.forEach((pos, i) => {
    const usedLevels = new Set<number>();
    for (let j = 0; j < i; j++) {
      const other = positions[j];
      const closeEnough =
        Math.abs(pos.top - other.top) < LABEL_TOP_THRESHOLD &&
        Math.abs(pos.left - other.left) < LABEL_LEFT_THRESHOLD;
      if (closeEnough) usedLevels.add(levels[j]);
    }
    let level = 0;
    while (usedLevels.has(level)) level++;
    levels.push(level);
  });

  return levels;
}

// キャラの揺れアニメーションの開始タイミングをずらすための遅延(秒)。
// 全キャラが同時に揺れると不自然なので、文字列ごとにばらけさせる。
export function deriveWiggleDelay(poem: string): number {
  const rng = makeRng(hashString(`${poem}::wiggle`) || 1);
  return rng() * 3;
}

const KATAKANA_RUN = /[ァ-ヶー]{2,}/g;

// 敬称を追加する前からあった、元々のラインナップ。
const ORIGINAL_HONORIFICS = ["くん", "ちゃん", "にゃん", "先生", "さん", "氏"];

// 2026-10-03に追加したぶん。
const ADDED_HONORIFICS = [
  "様",
  "殿",
  "丸",
  "之介",
  "ぴょん",
  "博士",
  "閣下",
  "隊長",
  "王",
  "っち",
  "ル",
  "型兵器",
  "リーダー",
  "の海",
];

const HONORIFICS = [...ORIGINAL_HONORIFICS, ...ADDED_HONORIFICS];

// この日時より前に鍋に入ったキャラは、敬称を追加する前の元のラインナップから
// 選び直す(追加後にHONORIFICSの並びや長さが変わっても、投入時に付いていた
// 敬称が変わらないようにするため)。
const HONORIFIC_EXPANSION_AT = new Date("2026-10-03T00:00:00+09:00").getTime();

// 川柳の文字列から名前を抜き出す。カタカナの連続部分があればそれを、
// なければ末尾の数文字をフォールバックとして使う。
// さらに、くん/ちゃん/にゃん等の敬称を文字列ごとに決定論的に割り振る。
// createdAtを渡すと、敬称追加より前に入ったキャラは元のラインナップから選ぶ。
// (本体+敬称をそれぞれ別で使いたい箇所があるため分けて返す)
export function deriveNameParts(
  poem: string,
  createdAt?: string,
): { base: string; honorific: string } {
  const trimmed = poem.trim();
  if (!trimmed) return { base: "なまえなし", honorific: "" };

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
  const isBeforeExpansion =
    createdAt !== undefined && new Date(createdAt).getTime() < HONORIFIC_EXPANSION_AT;
  const pool = isBeforeExpansion ? ORIGINAL_HONORIFICS : HONORIFICS;
  const honorific = pool[Math.floor(rng() * pool.length)];
  return { base, honorific };
}

export function deriveName(poem: string, createdAt?: string): string {
  const { base, honorific } = deriveNameParts(poem, createdAt);
  return `${base}${honorific}`;
}
