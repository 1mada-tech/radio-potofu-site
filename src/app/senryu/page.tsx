import type { Metadata } from "next";
import EssayCard from "@/components/EssayCard";
import { getEssaysByType, ESSAY_TYPE_SENRYU } from "@/lib/microcms";
import { getSenryuCaption } from "@/lib/caption";

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
        <p className="senryu-caption">
          {caption.before}
          <span className="senryu-caption__word">{caption.word}</span>
          {caption.after}
        </p>
      )}
      {contents.length > 0 ? (
        <>
          <div className="list">
            {contents.map((essay) => (
              <EssayCard key={essay.id} essay={essay} basePath="/senryu" />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/senryu?page=${p}`}
                  className={
                    p === page
                      ? "pagination__item pagination__item--active"
                      : "pagination__item"
                  }
                >
                  {p}
                </a>
              ))}
            </nav>
          )}
        </>
      ) : (
        <p className="empty-message">まだ投稿がありません。</p>
      )}
    </div>
  );
}
