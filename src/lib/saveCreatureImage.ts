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

export type CreatureImageSource = {
  poem: string;
  createdAt?: string;
  honorific?: string;
  authorName?: string | null;
  poetName?: string | null;
  entryNumber?: number;
  note: string;
};

export function renderCreatureImageDataUrl(source: CreatureImageSource): string {
  const canvas = document.createElement("canvas");
  drawCreatureShareImage(canvas, { ...source, noteOverride: source.note });
  return canvas.toDataURL("image/png");
}

// 鍋のキャラ画像を端末に保存/共有する。スマホ(特にiOS Safari)は
// <a download>のデータURL保存が効かないことが多いため、対応していれば
// 端末標準の共有シートを優先する。ただしWindowsのPC(Edge/Chrome)も
// navigator.share自体には対応しており、そちらだと「近くのデバイスに送る」
// 「Outlookで送る」等のOS共有UIが開いてしまい、PC本体への保存という
// 目的には合わない。タッチ操作が主な端末(スマホ・タブレット)のときだけ
// 共有シートを使う。
export function saveOrShareCreatureImage(source: CreatureImageSource, dataUrl?: string) {
  const resolvedDataUrl = dataUrl ?? renderCreatureImageDataUrl(source);
  const name = deriveName(source.poem, source.createdAt, source.honorific, source.entryNumber);
  const blob = dataUrlToBlob(resolvedDataUrl);
  const fileName = `${name}.png`;
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
}
