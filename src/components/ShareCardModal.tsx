"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { renderCreatureImageDataUrl, saveOrShareCreatureImage } from "@/lib/saveCreatureImage";
import { deriveName } from "@/lib/creature";

// ツールチップから「鍋カード(住民票)を見る」を押した時に出すプレビュー。
// いきなりダウンロード/共有シートが開くと「見たかっただけなのに保存
// された」体験になりやすいため、まず画像をポップアップで見せてから、
// 気に入った場合だけ明示的に保存を選べるようにしている。
export default function ShareCardModal({
  poem,
  createdAt,
  authorName,
  poetName,
  entryNumber,
  note,
  onClose,
}: {
  poem: string;
  createdAt?: string;
  authorName?: string | null;
  poetName?: string | null;
  entryNumber?: number;
  note: string;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const name = deriveName(poem, createdAt);

  useEffect(() => {
    setDataUrl(renderCreatureImageDataUrl({ poem, createdAt, authorName, poetName, entryNumber, note }));
    // 開くたびに最新の内容で描き直す。依存配列はpropsそのまま。
  }, [poem, createdAt, authorName, poetName, entryNumber, note]);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSave = () => {
    setSaving(true);
    setError(false);
    try {
      saveOrShareCreatureImage({ poem, createdAt, authorName, poetName, entryNumber, note }, dataUrl ?? undefined);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="share-card-modal__backdrop" onClick={onClose}>
      <div className="share-card-modal" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="share-card-modal__close"
          onClick={onClose}
          aria-label="閉じる"
        >
          ×
        </button>
        {dataUrl ? (
          <img src={dataUrl} alt={`${name}の鍋カード(住民票)`} className="share-card-modal__image" />
        ) : (
          <div className="share-card-modal__loading">画像を生成中…</div>
        )}
        <button
          type="button"
          className="share-card-modal__save"
          onClick={handleSave}
          disabled={saving || !dataUrl}
        >
          {saving ? "保存中…" : "この画像を保存"}
        </button>
        {error && (
          <p className="share-creature-button__error">
            保存に失敗しました。お使いのブラウザでは対応していないかもしれません。
          </p>
        )}
      </div>
    </div>,
    document.body,
  );
}
