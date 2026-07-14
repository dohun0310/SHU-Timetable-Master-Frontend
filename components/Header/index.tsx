"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useBasket } from "@/components/BasketProvider";
import { semesterLabels, type SemesterInfo } from "@/lib/timetable/types";

const navigation = [
  { href: "/", label: "강좌 찾기" },
  { href: "/build", label: "시간표 만들기" },
  { href: "/my", label: "내 시간표" },
];

function isCurrent(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function Header({ semester }: { semester: SemesterInfo | null }) {
  const pathname = usePathname();
  const { baskets } = useBasket();

  return (
    <header className="bg-background/90 sticky top-0 z-20 border-b border-gray-100 backdrop-blur dark:border-gray-800">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight">
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
                    ? "bg-foreground text-background rounded-md px-3 py-1.5 font-medium"
                    : "hover:bg-foreground/10 hover:text-foreground rounded-md px-3 py-1.5 text-gray-600 dark:text-gray-400"
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {baskets.length > 0 ? (
            <span className="bg-foreground text-background rounded-md px-2 py-0.5 text-xs font-medium">
              바구니 {baskets.length}
            </span>
          ) : null}
          {semester ? (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {semester.academicYear}학년도 {semesterLabels[semester.semester]}
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
