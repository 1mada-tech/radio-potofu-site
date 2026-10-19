"use client";

import { useEffect, useRef, useState } from "react";
import CreatureFace from "@/components/CreatureFace";
import ShareCreatureButton from "@/components/ShareCreatureButton";
import ShareCardModal from "@/components/ShareCardModal";
import { deriveName, daysLeft } from "@/lib/creature";
import { formatDate } from "@/lib/date";

// 鍋の記録の各行末に出すミニ顔アイコン。PC ではCSSのhoverで
// ツールチップを出せるが、スマホ等タッチ端末にはhoverがないので、
// タップでも開閉できるようにクライアントコンポーネントにしている。
export default function PotLogFaceTooltip({
  poem,
  authorName,
  poetName,
  createdAt,
  honorific,
  entryNumber,
  note,
  tooltipLifespanTemplate,
}: {
  poem: string;
  authorName: string | null;
  poetName: string | null;
  createdAt: string;
  honorific: string;
  entryNumber: number;
  note: string | null;
  tooltipLifespanTemplate: string;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  // ツールチップの開閉(open)とは別の状態にしておく。ホバーが外れて
  // ツールチップ自体は閉じても、プレビューは出したままにするため。
  const [previewOpen, setPreviewOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  // アイコン(24x24)からツールチップ内のボタンへポインタを移動する間、
  // アイコン自体からは一旦外れるため、即座に閉じるとボタンまで辿り着けない。
  // 少し待ってから閉じることで、その間にツールチップ側へポインタが入れば
  // cancelCloseでキャンセルされ、開いたままになる(PotSceneと同じ仕組み)。
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), 200);
  };
  useEffect(() => cancelClose, []);

  // 記録リストはスクロール枠(overflow:auto)の中にあるので、普通にCSSの
  // position:absoluteで出すとアイコンの上にはみ出た部分が枠に切り取られて
  // 見えなくなる。position:fixedで画面基準の座標に置くことでこれを避ける。
  function updateCoords() {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect) return;
    // ツールチップ幅200px(.pot__tooltip)の半分+余白ぶん、画面端でクランプする。
    const halfWidth = 108;
    const idealLeft = rect.left + rect.width / 2;
    const left = Math.min(Math.max(idealLeft, halfWidth), window.innerWidth - halfWidth);
    setCoords({ top: rect.top, left });
  }

  // 開いている間、外側のクリックやスクロールで閉じる
  // (スクロールすると座標がずれるので、追従させるより閉じる方にしている)。
  useEffect(() => {
    if (!open) return;
    function handleOutside(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleScroll() {
      setOpen(false);
    }
    document.addEventListener("click", handleOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("click", handleOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [open]);

  return (
    <span
      ref={wrapRef}
      className="pot-log-item__face-wrap"
      tabIndex={0}
      // onMouseEnterが先にopenをtrueにしていることがあるため、ここをトグルに
      // すると開いた直後のタップで即座に閉じてしまう。常に開く動作にし、
      // 閉じるのは外側タップ/スクロール/マウスアウトに任せる。
      onClick={() => {
        cancelClose();
        updateCoords();
        setOpen(true);
      }}
      onMouseEnter={() => {
        cancelClose();
        updateCoords();
        setOpen(true);
      }}
      onMouseLeave={scheduleClose}
      onFocus={() => {
        cancelClose();
        updateCoords();
        setOpen(true);
      }}
      onBlur={(event) => {
        // フォーカスがツールチップ内のボタン等、自分の子要素に移っただけなら
        // 閉じない(relatedTargetがwrapRefの外に出た時だけ閉じる)。
        if (wrapRef.current && wrapRef.current.contains(event.relatedTarget as Node)) return;
        setOpen(false);
      }}
    >
      <span className="pot-log-item__face" aria-hidden="true">
        <CreatureFace poem={poem} createdAt={createdAt} />
      </span>
      {/* 鍋の中のキャラにマウスオーバーした時と同じ内容のツールチップ。 */}
      {open && coords && (
        <div
          className="pot__tooltip pot-log-item__tooltip"
          style={{ top: coords.top, left: coords.left }}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
        >
          <div className="pot__tooltip-head">
            <span className="pot__tooltip-face" aria-hidden="true">
              <CreatureFace poem={poem} createdAt={createdAt} />
            </span>
            <p className="pot__tooltip-name">{deriveName(poem, createdAt, honorific)}</p>
          </div>
          <p className="pot__tooltip-poem">{poem}</p>
          <p className="pot__tooltip-meta">
            {poetName ? `作: ${poetName}(投稿: ${authorName || "名無し"})` : authorName || "名無し"}{" "}
            ・ {formatDate(createdAt)}
          </p>
          <p className="pot__tooltip-lifespan">
            {tooltipLifespanTemplate.replace("x日", `${daysLeft(createdAt)}日`)}
          </p>
          <ShareCreatureButton
            poem={poem}
            createdAt={createdAt}
            honorific={honorific}
            authorName={authorName}
            poetName={poetName}
            entryNumber={entryNumber}
            note={note}
            onRequestPreview={() => setPreviewOpen(true)}
          />
        </div>
      )}
      {previewOpen && note && (
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
    </span>
  );
}
