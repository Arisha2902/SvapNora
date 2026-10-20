/** Prev/next pagination bound to the backend meta: { page, totalPages, total }. */
export default function Pagination({ page = 1, totalPages = 1, onChange, total, limit }) {
  if (!totalPages || totalPages <= 1) return null;

  const from = total && limit ? (page - 1) * limit + 1 : null;
  const to = total && limit ? Math.min(page * limit, total) : null;

  return (
    <nav className="pager" aria-label="Pagination">
      {total ? (
        <p className="pager__info">
          Showing {from}–{to} of {total}
        </p>
      ) : (
        <p className="pager__info">
          Page {page} of {totalPages}
        </p>
      )}

      <div className="pager__controls">
        <button
          type="button"
          className="pager__btn"
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
        >
          ‹ Prev
        </button>
        <span className="pager__page" aria-current="page">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="pager__btn"
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next ›
        </button>
      </div>
    </nav>
  );
}
