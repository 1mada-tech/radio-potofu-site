import type { Metadata } from "next";
import EssayCard from "@/components/EssayCard";
import { getEssaysByType, ESSAY_TYPE_NOTE } from "@/lib/microcms";

export const metadata: Metadata = { title: "ひみつノート" };

const PER_PAGE = 12;

export default async function NotePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const offset = (page - 1) * PER_PAGE;
  const { contents, totalCount } = await getEssaysByType(
    ESSAY_TYPE_NOTE,
    PER_PAGE,
    offset,
  );
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));

  return (
    <div className="container page">
      <h1>ひみつノート</h1>
      {contents.length > 0 ? (
        <>
          <div className="list">
            {contents.map((essay) => (
              <EssayCard key={essay.id} essay={essay} basePath="/note" />
            ))}
          </div>
          {totalPages > 1 && (
            <nav className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`/note?page=${p}`}
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
