"use client";

type PaginationProps = {
  page: number;
  totalPages: number;
  hrefTemplate: string;
};

export default function Pagination({ page, totalPages, hrefTemplate }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const hrefForPage = (p: number) => hrefTemplate.replace("{page}", String(p));

  return (
    <nav className="pagination">
      {page > 1 ? (
        <a href={hrefForPage(page - 1)} className="pagination__arrow">
          ← 前へ
        </a>
      ) : (
        <span className="pagination__arrow pagination__arrow--disabled">← 前へ</span>
      )}

      <select
        className="pagination__select"
        value={page}
        onChange={(e) => {
          window.location.href = hrefForPage(Number(e.target.value));
        }}
        aria-label="ページを選択"
      >
        {pages.map((p) => (
          <option key={p} value={p}>
            {p} / {totalPages}
          </option>
        ))}
      </select>

      {page < totalPages ? (
        <a href={hrefForPage(page + 1)} className="pagination__arrow">
          次へ →
        </a>
      ) : (
        <span className="pagination__arrow pagination__arrow--disabled">次へ →</span>
      )}
    </nav>
  );
}
