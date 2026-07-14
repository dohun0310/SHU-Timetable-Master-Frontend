"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { semesterLabels, type SemesterInfo } from "@/lib/timetable/types";

const navigation = [
  { href: "/", label: "강좌 찾기" },
  { href: "/build", label: "시간표 만들기" },
  { href: "/my", label: "내 시간표" },
];

function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader({ semester }: { semester: SemesterInfo | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          시간표 마법사
        </Link>
        <nav aria-label="주요 메뉴" className="flex items-center gap-1 text-sm">
          {navigation.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={
                  current
                    ? "rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        {semester ? (
          <span className="ml-auto text-sm text-zinc-500 dark:text-zinc-400">
            {semester.academicYear}학년도 {semesterLabels[semester.semester]}
          </span>
        ) : null}
      </div>
    </header>
  );
}
