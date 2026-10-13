"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CreatureFace from "@/components/CreatureFace";
import ShareCreatureButton from "@/components/ShareCreatureButton";
import { deriveName } from "@/lib/creature";

type CreatedCreature = {
  id: number;
  authorName: string | null;
  poem: string;
  createdAt: string;
};

// スマホでは、他アプリ(X/写真アプリ等)に一度切り替えて戻ってくると、
// ブラウザがタブを裏で再読み込みしてしまうことがあり、その場合この
// 「投稿した直後」の案内(Reactのstate)が消えてしまう。ユーザー操作で
// 閉じたわけではないのに消えるのは意図しない挙動なので、
// sessionStorageにも残しておき、再読み込み後も復元できるようにする。
const JUST_POSTED_KEY = "radio-potofu-pot-just-posted";

function loadJustPosted(): CreatedCreature | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(JUST_POSTED_KEY);
    return raw ? (JSON.parse(raw) as CreatedCreature) : null;
  } catch {
    return null;
  }
}

function saveJustPosted(creature: CreatedCreature | null) {
  if (typeof window === "undefined") return;
  try {
    if (creature) sessionStorage.setItem(JUST_POSTED_KEY, JSON.stringify(creature));
    else sessionStorage.removeItem(JUST_POSTED_KEY);
  } catch {
    /* プライベートブラウズ等で使えなくても、表示自体は問題なく動く */
  }
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("failed");
  return res.json();
}

export default function PotForm({
  namePlaceholder,
  poemPlaceholder,
  submitLabel,
}: {
  namePlaceholder: string;
  poemPlaceholder: string;
  submitLabel: string;
}) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [poem, setPoem] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [justPosted, setJustPostedState] = useState<CreatedCreature | null>(null);

  // マウント時、sessionStorageに残っていれば復元する(タブの裏側リロード対策)。
  useEffect(() => {
    const restored = loadJustPosted();
    if (restored) setJustPostedState(restored);
  }, []);

  const setJustPosted = (creature: CreatedCreature | null) => {
    setJustPostedState(creature);
    saveJustPosted(creature);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poem.trim() || submitting) return;
    setSubmitting(true);
    try {
      const result = await postJson("/api/pot", { authorName, poem, website });
      if (result.creature) setJustPosted(result.creature);
      setAuthorName("");
      setPoem("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="pot-form">
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder={namePlaceholder}
          className="pot-form__name"
          maxLength={50}
        />
        <textarea
          value={poem}
          onChange={(e) => setPoem(e.target.value)}
          placeholder={poemPlaceholder}
          className="pot-form__poem"
          maxLength={200}
          rows={2}
          required
        />
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="pot-form__honeypot"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
        <button type="submit" className="pot-form__submit" disabled={submitting}>
          {submitting ? "生成中…" : submitLabel}
        </button>
        <p className="form-notice">入力内容は表示のために保存されます。</p>
      </form>

      {justPosted && (
        <div className="pot-form__posted" role="status">
          <button
            type="button"
            className="pot-form__posted-close"
            onClick={() => setJustPosted(null)}
            aria-label="閉じる"
          >
            ×
          </button>
          <span className="pot-form__posted-face" aria-hidden="true">
            <CreatureFace poem={justPosted.poem} createdAt={justPosted.createdAt} />
          </span>
          <p className="pot-form__posted-message">
            「{deriveName(justPosted.poem, justPosted.createdAt)}」が鍋に入りました!
          </p>
          <p className="pot-form__posted-hint">
            下のボタンを押すと、この子の画像が保存できます。
            <br />
            保存した画像をXやInstagramなどに「投稿」してもらえると、
            ラジオポトフを知らない人にも届いて嬉しいです!
          </p>
          <ShareCreatureButton
            poem={justPosted.poem}
            createdAt={justPosted.createdAt}
            authorName={justPosted.authorName}
          />
        </div>
      )}
    </>
  );
}
