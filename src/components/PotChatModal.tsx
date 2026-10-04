"use client";

import { useEffect, useState } from "react";
import CreatureFace from "@/components/CreatureFace";
import { generatePotChat, type PotChatLine, type PotChatTopics } from "@/lib/potChat";
import { linkifyChatText, type SectionLink } from "@/lib/potChatLinks";
import { formatDateTime } from "@/lib/date";

export type PotChatRosterItem = {
  poem: string;
  name: string;
  honorific: string;
  createdAt?: string;
};

// 「盗み聞きする」ボタンを押すと、鍋の面々のアイコン一覧+自動生成の
// 会話をポップアップで見せる。ボタンを押すたびに会話を引き直す。
// roster/topicsはサーバー側(PotChat.tsx)で取得済みのものをそのまま
// 受け取り、会話の組み立て自体はここ(クライアント側)で行う。
export default function PotChatModal({
  roster,
  topics,
}: {
  roster: PotChatRosterItem[];
  topics: PotChatTopics;
}) {
  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<PotChatLine[]>([]);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);

  // 「もう一度盗み聞きする」を連打すると同じセリフに当たりやすいので、
  // 直近数回分で使ったセリフをブラウザに覚えておいて避ける。
  // (サーバー側の状態ではなく、あくまでこの端末だけのちょっとした
  // 工夫なのでlocalStorageで十分。読み書きに失敗しても動作に支障が
  // 出ないようtry/catchで囲む。)
  const RECENT_KEYS_STORAGE_KEY = "potChatRecentKeys";
  const RECENT_KEYS_LIMIT = 24; // 直近3回分(8行×3)程度を覚えておく

  function readRecentKeys(): string[] {
    try {
      const raw = localStorage.getItem(RECENT_KEYS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  }

  function writeRecentKeys(keys: string[]) {
    try {
      localStorage.setItem(
        RECENT_KEYS_STORAGE_KEY,
        JSON.stringify(keys.slice(-RECENT_KEYS_LIMIT)),
      );
    } catch {
      // 保存できなくても(プライベートモード等)動作には影響しない
    }
  }

  // エピソード/note記事は、タイトル自体に直接リンクを張る
  // (「最新回」「note」という単語の方には張らない)。会話には最新に
  // 限らず過去のものも登場しうるので、候補全件分のリンクを用意する。
  const resolvedDynamicLinks: SectionLink[] = [
    ...(topics.episodes ?? []).map((e) => ({ label: e.title, href: e.url, external: true })),
    ...(topics.notes ?? []).map((n) => ({ label: n.title, href: n.url, external: true })),
  ];

  function reroll() {
    const recentKeys = readRecentKeys();
    const { lines, usedKeys } = generatePotChat(roster, 8, topics, new Set(recentKeys));
    setChat(lines);
    setGeneratedAt(Date.now());
    writeRecentKeys([...recentKeys, ...usedKeys]);
  }

  function handleOpen() {
    reroll();
    setOpen(true);
  }

  // 開いている間、背景のページがスクロールしないようにする。
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Escキーで閉じる。
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  return (
    <>
      <button type="button" className="pot-chat__trigger" onClick={handleOpen}>
        鍋内のひとときを盗み聞きする
      </button>

      {open && (
        <div
          className="pot-chat-modal__backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="pot-chat-modal"
            role="dialog"
            aria-modal="true"
            aria-label="鍋内のひととき"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="pot-chat-modal__close"
              onClick={() => setOpen(false)}
              aria-label="閉じる"
            >
              ×
            </button>

            <h3 className="pot-chat-modal__heading">
              鍋内のひととき
              {generatedAt && (
                <span className="pot-chat-modal__timestamp">{formatDateTime(generatedAt)}</span>
              )}
            </h3>
            <p className="pot-chat-modal__caption">
              鍋の中の様子を、ちょっとだけ盗み聞きしてみました。
            </p>

            <ul className="pot-chat__roster">
              {roster.map((r) => (
                <li key={r.name} className="pot-chat__roster-item">
                  <span className="pot-chat__roster-face" aria-hidden="true">
                    <CreatureFace poem={r.poem} createdAt={r.createdAt} />
                  </span>
                  <span className="pot-chat__roster-name">{r.name}</span>
                </li>
              ))}
            </ul>

            <ol className="pot-chat__log">
              {chat.map((line, i) => (
                <li key={i} className="pot-chat__line">
                  <span className="pot-chat__line-speaker">{line.speaker}</span>
                  <span className="pot-chat__line-text">
                    「{linkifyChatText(line.text, resolvedDynamicLinks)}」
                  </span>
                </li>
              ))}
            </ol>

            <div className="pot-chat-modal__actions">
              <button type="button" className="pot-chat-modal__reroll" onClick={reroll}>
                もう一度盗み聞きする
              </button>
              <button
                type="button"
                className="pot-chat-modal__close-text"
                onClick={() => setOpen(false)}
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
