import type { Metadata } from "next";
import Link from "next/link";
import EssayCard from "@/components/EssayCard";
import { getEssaysByType, ESSAY_TYPE_NOTE } from "@/lib/microcms";
import { getSimpleCaption } from "@/lib/pageCaption";
import { formatDate } from "@/lib/date";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = { title: "ひみつノート" };

const PER_PAGE = 12;

const NOTE_CAPTION_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1J_fSVe7sqRQaeelc2A9ocQhAbxXqB6OHpv0BxW6CbEk/export?format=csv&gid=1563106714";

export default async function NotePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PER_PAGE;
  const [{ contents, totalCount }, caption] = await Promise.all([
    getEssaysByType(ESSAY_TYPE_NOTE, PER_PAGE, offset),
    getSimpleCaption(NOTE_CAPTION_CSV_URL),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const featured = page === 1 ? contents[0] : null;
  const rest = featured ? contents.slice(1) : contents;

  return (
    <div className="container page">
      <div className="page-heading">
        <h1>ひみつノート</h1>
        <p className="page-subtitle">Notes</p>
      </div>
      {caption && <p className="page-caption">{caption}</p>}
      {contents.length > 0 ? (
        <>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefTemplate="/note?page={page}"
          />
          {featured && (
            <section className="note-featured">
              <p className="note-featured__label">最新記事</p>
              <h2 className="note-featured__title">
                <Link href={`/note/${featured.id}`}>{featured.title}</Link>
              </h2>
              <div
                className="article__body"
                dangerouslySetInnerHTML={{ __html: featured.body }}
              />
              <p className="article__date article__date--footer">
                {formatDate(featured.publishDate)}
                {featured.author ? ` / ${featured.author}` : ""}
              </p>
            </section>
          )}
          {rest.length > 0 && (
            <div className="list">
              {rest.map((essay) => (
                <EssayCard key={essay.id} essay={essay} basePath="/note" />
              ))}
            </div>
          )}
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefTemplate="/note?page={page}"
          />
        </>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
