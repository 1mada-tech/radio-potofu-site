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
  entryNumber,
}: {
  scene: SceneVariant;
  creatureA: EncounterCreatureInput;
  creatureB: EncounterCreatureInput;
  encounterNote: string;
  metAt?: string;
  entryNumber?: number;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <>
      <button type="button" className="share-creature-button" onClick={() => setPreviewOpen(true)}>
        出会いカードを見る
      </button>
      {previewOpen && (
        <ShareEncounterModal
          scene={scene}
          creatureA={creatureA}
          creatureB={creatureB}
          encounterNote={encounterNote}
          metAt={metAt}
          entryNumber={entryNumber}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
