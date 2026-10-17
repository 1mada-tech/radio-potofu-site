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
  poetName,
  entryNumber,
  note,
}: {
  poem: string;
  createdAt?: string;
  authorName?: string | null;
  poetName?: string | null;
  entryNumber?: number;
  note?: string | null;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  // noteが入る(=鍋カードが発行される)まで、画像の保存・共有はさせない。
  // ここで保存できてしまうと、汎用の仮文面のカードが広まってしまうため。
  if (!note) {
    return <span className="share-creature-button share-creature-button--pending">鍋カード(住民票)申請中</span>;
  }

  const handleClick = (event: React.MouseEvent) => {
    // 親要素(ツールチップ)のクリックで閉じる処理に巻き込まれないようにする。
    event.stopPropagation();
    setSaving(true);
    setError(false);
    try {
      const canvas = document.createElement("canvas");
      drawCreatureShareImage(canvas, { poem, createdAt, authorName, poetName, entryNumber, noteOverride: note });
      const name = deriveName(poem, createdAt);
      const blob = dataUrlToBlob(canvas.toDataURL("image/png"));
      const fileName = `${name}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // スマホ(特にiOS Safari)は<a download>のデータURL保存が効かないことが
      // 多いため、対応していれば端末標準の共有シートを優先する。ただし
      // WindowsのPC(Edge/Chrome)もnavigator.share自体には対応しており、
      // そちらだと「近くのデバイスに送る」「Outlookで送る」等のOS共有UIが
      // 開いてしまい、PC本体への保存という目的には合わない。タッチ操作が
      // 主な端末(スマホ・タブレット)のときだけ共有シートを使う。
      const isTouchPrimary =
        typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
      const canShare =
        isTouchPrimary &&
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] });

      const downloadDirectly = () => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      };

      if (canShare) {
        try {
          // HTTPS以外(secureContextでない)環境だとnavigator.share()自体が
          // 同期的に例外を投げることがある。捕まえ損ねると「押しても何も
          // 起きない」ように見えてしまうため、失敗時は直接ダウンロードに
          // フォールバックする。
          navigator.share({ files: [file], title: name }).catch(() => {
            /* 共有シートをキャンセルしただけの場合もあるので、エラー表示はしない */
          });
        } catch {
          downloadDirectly();
        }
      } else {
        downloadDirectly();
      }
    } catch {
      // 想定外の失敗(古いブラウザでのcanvas API非対応等)。
      // ボタンを押しても無反応に見えるのが一番困るので、必ず見える形で知らせる。
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="share-creature-button"
        onClick={handleClick}
        disabled={saving}
      >
        {saving ? "保存中…" : "鍋カード(住民票)を見る"}
      </button>
      {error && (
        <p className="share-creature-button__error">
          保存に失敗しました。お使いのブラウザでは対応していないかもしれません。
        </p>
      )}
    </>
  );
}
