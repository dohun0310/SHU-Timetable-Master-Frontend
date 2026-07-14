import { CourseCard } from "@/components/search/course-card";
import type { CoursePage } from "@/lib/contracts/course-catalog";

export function CourseList({ page }: { page: CoursePage }) {
  if (page.courses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
        조건에 맞는 강좌가 없습니다.
      </div>
    );
  }

  const first = (page.page - 1) * page.size + 1;
  const last = first + page.courses.length - 1;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        총 {page.total.toLocaleString()}개 중 {first.toLocaleString()}–{last.toLocaleString()}번째
        강좌
      </p>
      <ul className="flex flex-col gap-2">
        {page.courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </ul>
    </div>
  );
}

export function CourseListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-live="polite">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">강좌를 불러오는 중입니다…</p>
      <ul className="flex flex-col gap-2">
        {Array.from({ length: 6 }, (_, index) => (
          <li
            key={index}
            className="h-28 animate-pulse rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          />
        ))}
      </ul>
    </div>
  );
}
