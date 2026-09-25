"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("failed");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poem.trim() || submitting) return;
    setSubmitting(true);
    try {
      await postJson("/api/pot", { authorName, poem, website });
      setAuthorName("");
      setPoem("");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
    </form>
  );
}
