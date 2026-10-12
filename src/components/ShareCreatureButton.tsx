"use client";

import { useState } from "react";
import { drawCreatureShareImage } from "@/lib/shareImage";
import { deriveName } from "@/lib/creature";

// 鍋のキャラを正方形画像として保存するボタン。SNSにそのまま投稿しやすい
// サイズ(1080x1080)で書き出す。DOMのスクリーンショットではなく、見た目の
// 元データ(色・耳・目・口の種類)からcanvasに描き直している。
export default function ShareCreatureButton({
  poem,
  createdAt,
  authorName,
}: {
  poem: string;
  createdAt?: string;
  authorName?: string | null;
}) {
  const [saving, setSaving] = useState(false);

  const handleClick = (event: React.MouseEvent) => {
    // 親要素(ツールチップ)のクリックで閉じる処理に巻き込まれないようにする。
    event.stopPropagation();
    setSaving(true);
    try {
      const canvas = document.createElement("canvas");
      drawCreatureShareImage(canvas, { poem, createdAt, authorName });
      const name = deriveName(poem, createdAt);
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${name}.png`;
      link.click();
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      className="share-creature-button"
      onClick={handleClick}
      disabled={saving}
    >
      {saving ? "保存中…" : "画像を保存"}
    </button>
  );
}
