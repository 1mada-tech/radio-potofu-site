import type { Metadata } from "next";
import { getNoteArticles, NOTE_FEED_URL } from "@/lib/noteFeed";
import { formatDate } from "@/lib/date";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "note",
  description: "ラジオポトフのnoteの更新一覧です。",
  path: "/note-articles",
});
export const revalidate = 300;

export default async function NoteArticlesPage() {
  const articles = await getNoteArticles();
  const noteUrl = NOTE_FEED_URL.replace("/rss", "");

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>note</h1>
        <p className="page-subtitle">On note</p>
      </div>
      <p className="page-caption">
        ラジオポトフのnote（
        <a href={noteUrl} target="_blank" rel="noopener noreferrer">
          {noteUrl}
        </a>
        ）の更新一覧です。続きはnote側でお読みください。
      </p>
      {articles.length > 0 ? (
        <div className="list">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="card"
            >
              {article.thumbnail && (
                <div className="card__image">
                  {/* note側の画像で、サイズや枚数が予測できないためnext/imageは使わない */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={article.thumbnail} alt="" loading="lazy" />
                </div>
              )}
              <div>
                <p className="card__date">{formatDate(article.publishDate)}</p>
                <h3 className="card__title">{article.title}</h3>
                {article.excerpt && <p className="card__excerpt">{article.excerpt}</p>}
              </div>
            </a>
          ))}
        </div>
      ) : (
        <p className="empty-message">記事を取得できませんでした。</p>
      )}
    </div>
  );
}
