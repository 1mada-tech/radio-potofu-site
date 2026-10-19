"use client";

import { useState } from "react";
import ShareCardModal from "@/components/ShareCardModal";

// 鍋のキャラ画像をポップアップでプレビューしてから保存・共有できるボタン。
// SNSにそのまま投稿しやすいサイズ(1080x1080)で書き出す。DOMの
// スクリーンショットではなく、見た目の元データ(色・耳・目・口の種類)
// からcanvasに描き直している。
export default function ShareCreatureButton({
  poem,
  createdAt,
  honorific,
  authorName,
  poetName,
  entryNumber,
  note,
  onRequestPreview,
}: {
  poem: string;
  createdAt?: string;
  honorific?: string;
  authorName?: string | null;
  poetName?: string | null;
  entryNumber?: number;
  note?: string | null;
  // 渡された場合、クリック時はプレビューを自前で出さずこのコールバックを
  // 呼ぶだけにする(ホバーで開閉するツールチップ内向け。ホバーが外れると
  // ツールチップのJSXごと外れてしまう場所では、プレビューの開閉状態を
  // 呼び出し元の、ホバーに連動しない場所で持ってもらう必要があるため)。
  onRequestPreview?: () => void;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);

  // noteが入る(=鍋カードが発行される)まで、画像の保存・共有はさせない。
  // ここで保存できてしまうと、汎用の仮文面のカードが広まってしまうため。
  if (!note) {
    return <span className="share-creature-button share-creature-button--pending">鍋カード(住民票)申請中</span>;
  }

  const handleClick = (event: React.MouseEvent) => {
    // 親要素(ツールチップ)のクリックで閉じる処理に巻き込まれないようにする。
    event.stopPropagation();
    if (onRequestPreview) {
      onRequestPreview();
    } else {
      setPreviewOpen(true);
    }
  };

  return (
    <>
      <button type="button" className="share-creature-button" onClick={handleClick}>
        鍋カード(住民票)を見る
      </button>
      {previewOpen && (
        <ShareCardModal
          poem={poem}
          createdAt={createdAt}
          honorific={honorific}
          authorName={authorName}
          poetName={poetName}
          entryNumber={entryNumber}
          note={note}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </>
  );
}
