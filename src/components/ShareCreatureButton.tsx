"use client";

import { useState } from "react";
import { drawCreatureShareImage } from "@/lib/shareImage";
import { deriveName } from "@/lib/creature";

// data: URLをBlobに変換する(同期処理)。canvas.toBlob()は非同期なので、
// それだと「ユーザー操作に直接紐づくイベントの中でしか呼べない」
// navigator.share()の制約(主にiOS Safari)に引っかかることがある。
// atobでの変換なら全部クリックハンドラ内で同期的に完結する。
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

// 鍋のキャラを正方形画像として保存・共有するボタン。SNSにそのまま投稿
// しやすいサイズ(1080x1080)で書き出す。DOMのスクリーンショットではなく、
// 見た目の元データ(色・耳・目・口の種類)からcanvasに描き直している。
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
      const blob = dataUrlToBlob(canvas.toDataURL("image/png"));
      const fileName = `${name}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // スマホ(特にiOS Safari)は<a download>のデータURL保存が効かないことが
      // 多いため、対応していれば端末標準の共有シートを優先する(保存はもちろん、
      // そのままSNSにも渡せて一石二鳥)。非対応環境(主にPC)では従来通り
      // ファイルを直接ダウンロードする。
      const canShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] });

      if (canShare) {
        navigator.share({ files: [file], title: name }).catch(() => {
          /* 共有シートをキャンセルしただけの場合もあるので、エラー表示はしない */
        });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
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
