import type { Metadata } from "next";
import EssayCard from "@/components/EssayCard";
import { getEssaysByType, ESSAY_TYPE_SENRYU } from "@/lib/microcms";
import { getSenryuCaption } from "@/lib/caption";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = { title: "現代川柳" };

const PER_PAGE = 12;

export default async function SenryuPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PER_PAGE;
  const { contents, totalCount } = await getEssaysByType(
    ESSAY_TYPE_SENRYU,
    PER_PAGE,
    offset,
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const caption = await getSenryuCaption();

  return (
    <div className="container page">
      <h1>現代川柳</h1>
      {caption && (
        <p className="page-caption">
          {caption.before}
          <span className="senryu-caption__word">{caption.word}</span>
          {caption.after}
          {caption.version && (
            <span className="senryu-caption__version">{`version:${caption.version}`}</span>
          )}
        </p>
      )}
      {contents.length > 0 ? (
        <>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefForPage={(p) => `/senryu?page=${p}`}
          />
          <div className="list">
            {contents.map((essay) => (
              <EssayCard key={essay.id} essay={essay} basePath="/senryu" />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            hrefForPage={(p) => `/senryu?page=${p}`}
          />
        </>
      ) : (
        <p className="empty-message">近日始動</p>
      )}
    </div>
  );
}
