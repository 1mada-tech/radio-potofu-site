"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deriveName } from "@/lib/creature";
import { SCENE_LABELS, type SceneVariant } from "@/lib/encounterShareImage";
import type { EncounterCreatureRef } from "@/lib/potEncounters";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

const SCENES = Object.keys(SCENE_LABELS) as SceneVariant[];

type ResultState =
  | { kind: "created" }
  | { kind: "duplicate"; published: boolean }
  | { kind: "daily-cap-reached" }
  | { kind: "invalid" }
  | { kind: "error" };

// 2匹+場面を選んで「遭遇シーン」を申請するフォーム。PotForm.tsxと同じ
// 骨格(honeypot、postJson、送信後にrouter.refresh())を流用する。
// 申請が通っても画像はまだ無い(ひとことメッセージは後からClaudeが
// 手書きするため)ので、その場でカードは出さず案内メッセージだけ出す。
export default function EncounterRequestForm({ candidates }: { candidates: EncounterCreatureRef[] }) {
  const router = useRouter();
  const [aId, setAId] = useState("");
  const [bId, setBId] = useState("");
  const [scene, setScene] = useState<SceneVariant>(SCENES[0]);
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  const options = candidates.map((c) => ({
    id: String(c.id),
    label: `No.${String(c.entryNumber).padStart(3, "0")} ${deriveName(c.poem, c.createdAt, c.honorific, c.entryNumber)}`,
  }));

  // 「誰を選べばいいかわからない」人向けに、2匹まとめて無作為に選ぶ。
  const handleRandomPick = () => {
    if (candidates.length < 2) return;
    const indexA = Math.floor(Math.random() * candidates.length);
    let indexB = Math.floor(Math.random() * (candidates.length - 1));
    if (indexB >= indexA) indexB += 1;
    setAId(String(candidates[indexA].id));
    setBId(String(candidates[indexB].id));
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aId || !bId || submitting) return;
    if (aId === bId) {
      setResult({ kind: "invalid" });
      return;
    }
    setSubmitting(true);
    try {
      const data = await postJson("/api/pot/encounter", {
        creatureAId: Number(aId),
        creatureBId: Number(bId),
        scene,
        website,
      });
      const r = data.result;
      if (!r) {
        setResult({ kind: "error" });
        return;
      }
      if (r.status === "created") {
        setResult({ kind: "created" });
        setAId("");
        setBId("");
        router.refresh();
      } else if (r.status === "duplicate") {
        setResult({ kind: "duplicate", published: Boolean(r.existing?.note) });
      } else if (r.status === "daily-cap-reached") {
        setResult({ kind: "daily-cap-reached" });
      } else {
        setResult({ kind: "invalid" });
      }
    } catch {
      setResult({ kind: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="encounter-form">
      <div className="encounter-form__step-row">
        <p className="encounter-form__step-label">会わせたい2匹を選ぶ</p>
        <button type="button" className="encounter-form__random" onClick={handleRandomPick}>
          🎲 ランダムに選ぶ
        </button>
      </div>
      <div className="encounter-form__pickers">
        <select
          value={aId}
          onChange={(e) => {
            setAId(e.target.value);
            setResult(null);
          }}
          className="encounter-form__select"
          required
        >
          <option value="" disabled>
            1匹目を選ぶ
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id} disabled={o.id === bId}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="encounter-form__cross" aria-hidden="true">
          ×
        </span>
        <select
          value={bId}
          onChange={(e) => {
            setBId(e.target.value);
            setResult(null);
          }}
          className="encounter-form__select"
          required
        >
          <option value="" disabled>
            2匹目を選ぶ
          </option>
          {options.map((o) => (
            <option key={o.id} value={o.id} disabled={o.id === aId}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <p className="encounter-form__step-label">どんな場面で会わせる?</p>
      <div className="encounter-form__scenes">
        {SCENES.map((s) => (
          <button
            key={s}
            type="button"
            className={`encounter-form__scene${scene === s ? " encounter-form__scene--active" : ""}`}
            onClick={() => {
              setScene(s);
              setResult(null);
            }}
          >
            {SCENE_LABELS[s]}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="pot-form__honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <button type="submit" className="encounter-form__submit" disabled={submitting}>
        {submitting ? "申請中…" : "この2匹を会わせてみる"}
      </button>

      {result?.kind === "created" && (
        <p className="encounter-form__message">
          申請を受け付けました。24時間以内に場面カードが申請され、下のギャラリーに追加されます。
        </p>
      )}
      {result?.kind === "duplicate" && (
        <p className="encounter-form__message">
          {result.published
            ? "この２匹はすでにこの場所で出会い済です。下のギャラリーをご確認ください"
            : "この組み合わせはすでに申請中で、まもなく下のギャラリーに追加予定です。"}
        </p>
      )}
      {result?.kind === "daily-cap-reached" && (
        <p className="encounter-form__message">今日はもう1件申請がありました。また明日お試しください。</p>
      )}
      {result?.kind === "invalid" && <p className="encounter-form__message">同じ相手同士は選べません。</p>}
      {result?.kind === "error" && (
        <p className="encounter-form__message">エラーが起きました。少し時間を置いて試してみてください。</p>
      )}
    </form>
  );
}
