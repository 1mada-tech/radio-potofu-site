"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CreatureFace from "@/components/CreatureFace";
import ShareCreatureButton from "@/components/ShareCreatureButton";
import { deriveName } from "@/lib/creature";

type CreatedCreature = {
  id: number;
  authorName: string | null;
  poem: string;
  createdAt: string;
};

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
  const [justPosted, setJustPosted] = useState<CreatedCreature | null>(null);

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
