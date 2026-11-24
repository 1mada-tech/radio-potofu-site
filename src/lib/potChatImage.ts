import { deriveAppearance, type CreatureAppearance } from "@/lib/creature";
import { pathRoundedRect, pathTopRoundedRect, readableAccent, wrapTextChars } from "@/lib/cardCanvas";
import { drawCreatureFaceGlyph } from "@/lib/creatureFaceDraw";

// 「鍋内のひととき」(自動生成の会話)をSNSに投稿しやすい画像として
// 書き出すための描画ロジック。鍋カード(shareImage.ts)と違い複数の
// キャラが登場するため、カード全体を1色で染めるのではなく、外枠・
// フッターはサイト共通のブランドカラー(にんじん色)で統一し、話者名
// だけ各キャラ自身の属性カラーを使う。

export const POT_CHAT_IMAGE_WIDTH = 1080;

const BRAND_COLOR = "#f0791b"; // globals.cssの--color-accent(にんじん)と同じ

export type PotChatImageRosterItem = {
  name: string;
  poem: string;
  createdAt?: string;
};

export type PotChatImageLine = {
  speaker: string;
  text: string;
};

export function drawPotChatImage(
  canvas: HTMLCanvasElement,
  params: {
    roster: PotChatImageRosterItem[];
    lines: PotChatImageLine[];
    generatedAt?: number;
  },
): void {
  const W = POT_CHAT_IMAGE_WIDTH;
  const margin = 34;
  const frameRadius = 40;
  const cardPad = 16;
  const cardLeft = margin + cardPad;
  const cardRight = W - margin - cardPad;
  const cardWidth = cardRight - cardLeft;

  // 話者名ごとの見た目(そのキャラの鍋カードと同じ姿・色)。
  const appearanceByName = new Map<string, CreatureAppearance>();
  const colorByName = new Map<string, string>();
  for (const r of params.roster) {
    const appearance = deriveAppearance(r.poem, r.createdAt);
    appearanceByName.set(r.name, appearance);
    colorByName.set(r.name, readableAccent(appearance.bodyColor));
  }
  const colorFor = (name: string) => colorByName.get(name) ?? BRAND_COLOR;

  // 事前に必要な高さを測るため、一度ダミーcontextでレイアウトを計算する。
  const measureCtx = canvas.getContext("2d");
  if (!measureCtx) return;

  // --- ヘッダー ---
  const headerTop = margin + cardPad;
  const headerHeight = 96;

  // --- 住民票ロウ(顔アイコンを上、名前を下に。PotChatModalの
  // .pot-chat__roster-item と同じ「顔+名前を縦に積む」構成を踏襲する。
  // チップ化して色タグ・円クリップを足した案は本番の見た目に比べて
  // ごちゃついて見えたため不採用) ---
  const rosterTop = headerTop + headerHeight;
  const rosterPanelPad = 20;
  const itemGap = 18;
  const itemRowGap = 18;
  const faceIconSize = 64;
  const itemNameFont = "700 20px 'Noto Sans JP', sans-serif";
  const itemMinWidth = 90;
  measureCtx.font = itemNameFont;
  const itemWidths = params.roster.map((r) =>
    Math.max(itemMinWidth, measureCtx.measureText(r.name).width + 12),
  );
  const innerWidth = cardWidth - rosterPanelPad * 2;
  let rosterRows = 1;
  {
    let x = 0;
    for (const w of itemWidths) {
      if (x > 0 && x + itemGap + w > innerWidth) {
        rosterRows += 1;
        x = 0;
      }
      x += (x > 0 ? itemGap : 0) + w;
    }
  }
  const itemHeight = faceIconSize + 8 + 24; // 顔 + 隙間 + 名前1行
  const rosterInnerHeight = rosterRows * itemHeight + (rosterRows - 1) * itemRowGap;
  const rosterHeight = rosterPanelPad * 2 + rosterInnerHeight;

  // --- 会話ログ ---
  const chatTop = rosterTop + rosterHeight + 36;
  const chatMaxWidth = cardWidth - 8;
  const nameFont = "700 24px 'Noto Sans JP', sans-serif";
  const textFont = "400 30px 'Noto Sans JP', sans-serif";
  const nameLineHeight = 30;
  const textLineHeight = 40;
  const entryGap = 26;

  measureCtx.font = textFont;
  const entryLayouts = params.lines.map((line) => {
    const wrapped = wrapTextChars(measureCtx, `「${line.text}」`, chatMaxWidth, 2, "…」");
    return { line, wrapped, height: nameLineHeight + 4 + wrapped.length * textLineHeight };
  });
  const chatHeight =
    entryLayouts.reduce((sum, e) => sum + e.height, 0) + entryGap * Math.max(0, entryLayouts.length - 1);

  // --- CTA + フッター ---
  const ctaText = "あなたの川柳からキャラが生まれる";
  measureCtx.font = "700 24px 'Noto Sans JP', sans-serif";
  const ctaTextWidth = measureCtx.measureText(ctaText).width;
  const ctaPadX = 26;
  const ctaPadY = 14;
  const ctaTabWidth = ctaTextWidth + ctaPadX * 2;
  const ctaTabHeight = 24 + ctaPadY * 2;
  const footerHeight = 84;

  const H =
    chatTop + chatHeight + 40 + ctaTabHeight + 10 + footerHeight + margin + cardPad;

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // --- 背景(カード台紙) ---
  ctx.fillStyle = "#efe9da";
  ctx.fillRect(0, 0, W, H);

  // --- カードの外枠 ---
  ctx.save();
  ctx.fillStyle = BRAND_COLOR;
  pathRoundedRect(ctx, margin, margin, W - margin * 2, H - margin * 2, frameRadius);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#fbf8f1";
  pathRoundedRect(ctx, cardLeft, margin + cardPad, cardWidth, H - margin * 2 - cardPad * 2, frameRadius - 10);
  ctx.fill();
  ctx.restore();

  // --- ヘッダー ---
  ctx.save();
  ctx.textAlign = "left";
  ctx.fillStyle = "#211a15";
  ctx.font = "700 46px 'Zen Kaku Gothic New', 'Noto Sans JP', sans-serif";
  ctx.fillText("鍋内のひととき", cardLeft, headerTop + 46);
  ctx.font = "400 22px 'Noto Sans JP', sans-serif";
  ctx.fillStyle = "#6f665a";
  const dateLabel = params.generatedAt
    ? new Date(params.generatedAt)
        .toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
        .replace(/\//g, ".")
    : "";
  ctx.fillText(`鍋の中の様子を、ちょっとだけ盗み聞きしてみました。${dateLabel ? " / " + dateLabel : ""}`, cardLeft, headerTop + 78);
  ctx.restore();

  // --- 住民票ロウ ---
  ctx.save();
  ctx.fillStyle = "#efe6d4";
  pathRoundedRect(ctx, cardLeft, rosterTop, cardWidth, rosterHeight, 18);
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(33, 26, 21, 0.1)";
  pathRoundedRect(ctx, cardLeft, rosterTop, cardWidth, rosterHeight, 18);
  ctx.stroke();
  {
    let x = cardLeft + rosterPanelPad;
    let y = rosterTop + rosterPanelPad;
    params.roster.forEach((r, i) => {
      const w = itemWidths[i];
      if (x > cardLeft + rosterPanelPad && x - (cardLeft + rosterPanelPad) + itemGap + w > innerWidth) {
        y += itemHeight + itemRowGap;
        x = cardLeft + rosterPanelPad;
      } else if (x > cardLeft + rosterPanelPad) {
        x += itemGap;
      }
      const faceCx = x + w / 2;
      const faceCy = y + faceIconSize / 2;
      const appearance = appearanceByName.get(r.name);
      if (appearance) {
        const faceBodySize = faceIconSize * 0.82;
        drawCreatureFaceGlyph(ctx, {
          cx: faceCx,
          bodyTop: faceCy - faceBodySize * 0.46,
          bodySize: faceBodySize,
          appearance,
        });
      }

      ctx.font = itemNameFont;
      ctx.textAlign = "center";
      ctx.fillStyle = "#211a15";
      ctx.fillText(r.name, faceCx, y + faceIconSize + 8 + 18);

      x += w;
    });
  }
  ctx.restore();

  // --- 会話ログ ---
  ctx.save();
  let lineY = chatTop;
  for (const entry of entryLayouts) {
    const color = colorFor(entry.line.speaker);
    ctx.textAlign = "left";
    ctx.font = nameFont;
    ctx.fillStyle = color;
    ctx.fillText(entry.line.speaker, cardLeft, lineY + 22);

    ctx.font = textFont;
    ctx.fillStyle = "#3a332b";
    entry.wrapped.forEach((l, i) => {
      ctx.fillText(l, cardLeft, lineY + nameLineHeight + 4 + (i + 1) * textLineHeight - 10);
    });

    lineY += entry.height + entryGap;
  }
  ctx.restore();

  // --- フッター ---
  const footerTop = H - margin - cardPad - footerHeight;
  ctx.save();
  const ctaTabBottom = footerTop + 10;
  const ctaTabTop = ctaTabBottom - ctaTabHeight;
  const ctaTabLeft = cardLeft + 40;
  ctx.font = "700 24px 'Noto Sans JP', sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = BRAND_COLOR;
  pathTopRoundedRect(ctx, ctaTabLeft, ctaTabTop, ctaTabWidth, ctaTabHeight, ctaTabHeight / 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
  ctx.fillText(ctaText, ctaTabLeft + ctaTabWidth / 2, ctaTabTop + ctaPadY + 18);
  ctx.restore();

  ctx.save();
  pathRoundedRect(ctx, cardLeft, margin + cardPad, cardWidth, H - margin * 2 - cardPad * 2, frameRadius - 10);
  ctx.clip();
  ctx.fillStyle = BRAND_COLOR;
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
