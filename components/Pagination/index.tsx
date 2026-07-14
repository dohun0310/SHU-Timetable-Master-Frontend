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

export default function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  /** 범위를 벗어난 `?page=` 값도 있는 페이지처럼 보여준다. */
  const current = Math.min(Math.max(page, 1), totalPages);

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next <= 1) params.delete("page");
    else params.set("page", String(next));
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  const buttonClass = (active: boolean) =>
    active
      ? "bg-foreground text-background min-w-9 rounded-md px-3 py-1.5 text-sm font-medium"
      : "bg-foreground/5 hover:bg-foreground/10 min-w-9 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-300";

  return (
    <nav aria-label="페이지 이동" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        className={buttonClass(false)}
        disabled={current <= 1}
        onClick={() => goTo(current - 1)}
      >
        이전
      </button>
      {pageWindow(current, totalPages).map((target) => (
        <button
          key={target}
          type="button"
          aria-current={target === current ? "page" : undefined}
          className={buttonClass(target === current)}
          onClick={() => goTo(target)}
        >
          {target}
        </button>
      ))}
      <button
        type="button"
        className={buttonClass(false)}
        disabled={current >= totalPages}
        onClick={() => goTo(current + 1)}
      >
        다음
      </button>
      <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
        {current} / {totalPages}
      </span>
    </nav>
  );
}
