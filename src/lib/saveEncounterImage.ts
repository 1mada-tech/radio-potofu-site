import { drawEncounterShareImage, type SceneVariant, type EncounterCreatureInput } from "@/lib/encounterShareImage";
import { deriveName } from "@/lib/creature";

// data: URLをBlobに変換する(同期処理)。理由はsaveCreatureImage.tsと同じ
// (navigator.share()をクリックハンドラ内で同期的に呼べるようにするため)。
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export type EncounterImageSource = {
  scene: SceneVariant;
  creatureA: EncounterCreatureInput;
  creatureB: EncounterCreatureInput;
  encounterNote: string;
  metAt?: string;
  entryNumber?: number;
};

export function renderEncounterImageDataUrl(source: EncounterImageSource): string {
  const canvas = document.createElement("canvas");
  drawEncounterShareImage(canvas, source);
  return canvas.toDataURL("image/png");
}

export function saveOrShareEncounterImage(source: EncounterImageSource, dataUrl?: string) {
  const resolvedDataUrl = dataUrl ?? renderEncounterImageDataUrl(source);
  const nameA = deriveName(
    source.creatureA.poem,
    source.creatureA.createdAt,
    source.creatureA.honorific,
    source.creatureA.entryNumber,
  );
  const nameB = deriveName(
    source.creatureB.poem,
    source.creatureB.createdAt,
    source.creatureB.honorific,
    source.creatureB.entryNumber,
  );
  const blob = dataUrlToBlob(resolvedDataUrl);
  const fileName = `${nameA}×${nameB}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

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
      navigator.share({ files: [file], title: `${nameA}×${nameB}` }).catch(() => {
        /* 共有シートをキャンセルしただけの場合もあるので、エラー表示はしない */
      });
    } catch {
      downloadDirectly();
    }
  } else {
    downloadDirectly();
  }
}
