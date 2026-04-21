"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Props {
  total: number;
  perPage: number;
  currentPage: number;
}

export default function Pagination({ total, perPage, currentPage }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const next = new URLSearchParams(params.toString());
    if (page === 1) next.delete("page");
    else next.set("page", String(page));
    router.push(`${pathname}?${next.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Build page numbers to show: always show first, last, current ±1, with "..." gaps
  function pages(): (number | "...")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const set = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1].filter((n) => n >= 1 && n <= totalPages));
    const sorted = [...set].sort((a, b) => a - b);
    const result: (number | "...")[] = [];
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && (sorted[i] as number) - (sorted[i - 1] as number) > 1) result.push("...");
      result.push(sorted[i]);
    }
    return result;
  }

  const btnBase = "w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors";

  return (
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => goTo(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} border border-zinc-200 text-zinc-500 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
      </button>

      {pages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-zinc-400 text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => goTo(p as number)}
            className={`${btnBase} ${
              p === currentPage
                ? "bg-zinc-900 text-white border border-zinc-900"
                : "border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-900"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => goTo(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} border border-zinc-200 text-zinc-500 hover:border-zinc-400 disabled:opacity-30 disabled:cursor-not-allowed`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
      </button>
    </div>
  );
}
