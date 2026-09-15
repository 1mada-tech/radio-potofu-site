import type { Metadata } from "next";
import EssayCard from "@/components/EssayCard";
import { getEssaysByType, ESSAY_TYPE_NOTE } from "@/lib/microcms";
import { getSimpleCaption } from "@/lib/pageCaption";
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

  return (
    <div className="container page">
      <h1>ひみつノート</h1>
      {caption && <p className="page-caption">{caption}</p>}
      {contents.length > 0 ? (
        <>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefTemplate="/note?page={page}"
          />
          <div className="list">
            {contents.map((essay) => (
              <EssayCard key={essay.id} essay={essay} basePath="/note" />
            ))}
          </div>
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
