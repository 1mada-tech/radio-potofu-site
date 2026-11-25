"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { renderEncounterImageDataUrl, saveOrShareEncounterImage } from "@/lib/saveEncounterImage";
import { deriveName } from "@/lib/creature";
import type { SceneVariant, EncounterCreatureInput } from "@/lib/encounterShareImage";

// ShareCardModal.tsx(ソロカード用)と同じ考え方。遭遇シェアカード用。
export default function ShareEncounterModal({
  scene,
  creatureA,
  creatureB,
  encounterNote,
  metAt,
  entryNumber,
  onClose,
}: {
  scene: SceneVariant;
  creatureA: EncounterCreatureInput;
  creatureB: EncounterCreatureInput;
  encounterNote: string;
  metAt?: string;
  entryNumber?: number;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);
  const nameA = deriveName(creatureA.poem, creatureA.createdAt, creatureA.honorific, creatureA.entryNumber);
  const nameB = deriveName(creatureB.poem, creatureB.createdAt, creatureB.honorific, creatureB.entryNumber);

  useEffect(() => {
    setDataUrl(renderEncounterImageDataUrl({ scene, creatureA, creatureB, encounterNote, metAt, entryNumber }));
  }, [scene, creatureA, creatureB, encounterNote, metAt, entryNumber]);

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
      saveOrShareEncounterImage(
        { scene, creatureA, creatureB, encounterNote, metAt, entryNumber },
        dataUrl ?? undefined,
      );
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="share-card-modal__backdrop" onClick={onClose}>
      <div className="share-card-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="share-card-modal__close" onClick={onClose} aria-label="閉じる">
          ×
        </button>
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt={`${nameA}×${nameB}の遭遇シーンカード`} className="share-card-modal__image" />
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
