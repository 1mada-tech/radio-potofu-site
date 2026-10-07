import type { Metadata } from "next";
import { getEssaysByType, ESSAY_TYPE_NOTE } from "@/lib/microcms";
import { getSimpleCaption } from "@/lib/pageCaption";
import { formatDate } from "@/lib/date";
import NoteSidebar from "@/components/NoteSidebar";
import { pageMetadata } from "@/lib/pageMetadata";

export const metadata: Metadata = pageMetadata({
  title: "ひみつノート",
  description: "ラジオポトフのひみつのノート。ひみつです。",
  path: "/note",
});

const NOTE_CAPTION_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=1563106714";

export default async function NotePage() {
  const [{ contents }, caption] = await Promise.all([
    getEssaysByType(ESSAY_TYPE_NOTE, 100),
    getSimpleCaption(NOTE_CAPTION_CSV_URL),
  ]);
  const featured = contents[0];

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>ひみつノート</h1>
        <p className="page-subtitle">Notes</p>
      </div>
      {caption && <p className="page-caption">{caption}</p>}
      {featured ? (
        <div className="note-detail-layout">
          <article className="page--article">
            <h1>{featured.title}</h1>
            <div
              className="article__body"
              dangerouslySetInnerHTML={{ __html: featured.body }}
            />
            <p className="article__date article__date--footer">
              {formatDate(featured.publishDate)}
              {featured.author ? ` / ${featured.author}` : ""}
            </p>
          </article>
          <NoteSidebar essays={contents} currentId={featured.id} />
        </div>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
