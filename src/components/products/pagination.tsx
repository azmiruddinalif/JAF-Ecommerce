import Link from "next/link";

export function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={buildHref(Math.max(1, page - 1))}
        aria-disabled={page === 1}
        className={`px-3 py-2 text-xs uppercase tracking-wider ${
          page === 1 ? "pointer-events-none text-paper-dim/40" : "text-paper hover:text-gold"
        }`}
      >
        Prev
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`h-9 w-9 flex items-center justify-center text-sm ${
            p === page ? "bg-gold-bright text-ink font-semibold" : "text-paper hover:text-gold"
          }`}
        >
          {p}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, page + 1))}
        aria-disabled={page === totalPages}
        className={`px-3 py-2 text-xs uppercase tracking-wider ${
          page === totalPages ? "pointer-events-none text-paper-dim/40" : "text-paper hover:text-gold"
        }`}
      >
        Next
      </Link>
    </nav>
  );
}
