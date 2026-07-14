"use client";

import { useRouter, useSearchParams } from "next/navigation";

/** 현재 페이지 주변 최대 5개의 페이지 번호. */
function pageWindow(current: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(current - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  const pages: number[] = [];
  for (let page = Math.max(1, start); page <= end; page += 1) pages.push(page);
  return pages;
}

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  const buttonClass = (active: boolean) =>
    active
      ? "min-w-9 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      : "min-w-9 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800";

  return (
    <nav aria-label="페이지 이동" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        className={buttonClass(false)}
        disabled={page <= 1}
        onClick={() => goTo(page - 1)}
      >
        이전
      </button>
      {pageWindow(page, totalPages).map((target) => (
        <button
          key={target}
          type="button"
          aria-current={target === page ? "page" : undefined}
          className={buttonClass(target === page)}
          onClick={() => goTo(target)}
        >
          {target}
        </button>
      ))}
      <button
        type="button"
        className={buttonClass(false)}
        disabled={page >= totalPages}
        onClick={() => goTo(page + 1)}
      >
        다음
      </button>
      <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
        {page} / {totalPages}
      </span>
    </nav>
  );
}
