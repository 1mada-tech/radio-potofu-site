"use client";

import { useState } from "react";
import ShareEncounterModal from "@/components/ShareEncounterModal";
import type { SceneVariant, EncounterCreatureInput } from "@/lib/encounterShareImage";

export default function ShareEncounterButton({
  scene,
  creatureA,
  creatureB,
  encounterNote,
  metAt,
}: {
  scene: SceneVariant;
  creatureA: EncounterCreatureInput;
  creatureB: EncounterCreatureInput;
  encounterNote: string;
  metAt?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <button type="button" className="share-creature-button" onClick={() => setPreviewOpen(true)}>
        遭遇シーンカードを見る
      </button>
      {previewOpen && (
        <ShareEncounterModal
          scene={scene}
          creatureA={creatureA}
          creatureB={creatureB}
          encounterNote={encounterNote}
          metAt={metAt}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
