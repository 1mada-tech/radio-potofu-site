"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ThemePost, ThemeStatus } from "@/lib/themes";

const STATUS_LABEL: Record<Exclude<ThemeStatus, null>, string> = {
  considering: "検討中",
  adopted: "採用",
  recorded: "収録済み",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("failed");
}

function NewPostForm({ parentId, onDone }: { parentId?: number; onDone: () => void }) {
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || submitting) return;
    setSubmitting(true);
    try {
      await postJson("/api/themes", { parentId, authorName, body, website });
      setAuthorName("");
      setBody("");
      onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="theme-form">
      <input
        type="text"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="お名前(任意)"
        className="theme-form__name"
        maxLength={50}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentId ? "返信を入力" : "聴きたい／話したいテーマを入力"}
        className="theme-form__body"
        maxLength={1000}
        rows={parentId ? 2 : 3}
        required
      />
      <input
        type="text"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="theme-form__honeypot"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <button type="submit" className="theme-form__submit" disabled={submitting}>
        {submitting ? "送信中…" : parentId ? "返信する" : "投稿する"}
      </button>
    </form>
  );
}

function StatusSelect({ post, onDone }: { post: ThemePost; onDone: () => void }) {
  const [updating, setUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setUpdating(true);
    try {
      await postJson("/api/themes/status", { id: post.id, status: value });
      onDone();
    } finally {
      setUpdating(false);
    }
  };

  return (
    <select
      value={post.status ?? ""}
      onChange={handleChange}
      disabled={updating}
      className={`theme-post__status theme-post__status--${post.status ?? "none"}`}
    >
      <option value="">未設定</option>
      <option value="considering">{STATUS_LABEL.considering}</option>
      <option value="adopted">{STATUS_LABEL.adopted}</option>
      <option value="recorded">{STATUS_LABEL.recorded}</option>
    </select>
  );
}

function DeleteButton({ id, onDone }: { id: number; onDone: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleClick = async () => {
    if (!window.confirm("削除しますか？(返信も一緒に消えます)")) return;
    setDeleting(true);
    try {
      await postJson("/api/themes/delete", { id });
      onDone();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <button
      type="button"
      className="theme-post__delete"
      onClick={handleClick}
      disabled={deleting}
    >
      削除
    </button>
  );
}

function ThemePostItem({ post, onDone }: { post: ThemePost; onDone: () => void }) {
  const [replying, setReplying] = useState(false);

  return (
    <li className="theme-post">
      <div className="theme-post__head">
        <span className="theme-post__author">{post.authorName || "名無し"}</span>
        <span className="theme-post__date">{formatDate(post.createdAt)}</span>
        <StatusSelect post={post} onDone={onDone} />
      </div>
      <p className="theme-post__body">{post.body}</p>
      <div className="theme-post__actions">
        <button
          type="button"
          className="theme-post__reply-toggle"
          onClick={() => setReplying((v) => !v)}
        >
          {replying ? "閉じる" : "返信する"}
        </button>
        <DeleteButton id={post.id} onDone={onDone} />
      </div>
      {replying && (
        <NewPostForm
          parentId={post.id}
          onDone={() => {
            setReplying(false);
            onDone();
          }}
        />
      )}
      {post.replies.length > 0 && (
        <ul className="theme-post__replies">
          {post.replies.map((reply) => (
            <li key={reply.id} className="theme-reply">
              <div className="theme-post__head">
                <span className="theme-post__author">{reply.authorName || "名無し"}</span>
                <span className="theme-post__date">{formatDate(reply.createdAt)}</span>
              </div>
              <p className="theme-post__body">{reply.body}</p>
              <div className="theme-post__actions">
                <DeleteButton id={reply.id} onDone={onDone} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

export default function ThemeBoard({ initialPosts }: { initialPosts: ThemePost[] }) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="theme-board">
      <NewPostForm onDone={refresh} />
      {initialPosts.length > 0 ? (
        <ul className="theme-board__list">
          {initialPosts.map((post) => (
            <ThemePostItem key={post.id} post={post} onDone={refresh} />
          ))}
        </ul>
      ) : (
        <p className="empty-message">まだ投稿がありません。最初のテーマを投稿してみませんか？</p>
      )}
    </div>
  );
}
