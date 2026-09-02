type PaginationProps = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

export default function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <a
          key={p}
          href={hrefForPage(p)}
          className={
            p === page ? "pagination__item pagination__item--active" : "pagination__item"
          }
        >
          {p}
        </a>
      ))}
    </nav>
  );
}
