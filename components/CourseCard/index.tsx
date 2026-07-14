import BasketButton from "@/components/BasketButton";
import { isSchedulable } from "@/lib/timetable/schedulability";
import type { Course } from "@/lib/timetable/types";
import { professorText, scheduleLines } from "@/lib/utils/course-format";

export default function CourseCard({ course }: { course: Course }) {
  const schedulable = isSchedulable(course);

  return (
    <li className="bg-foreground/5 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="text-base font-semibold">{course.name}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {course.classNumber}분반 · {course.courseCode}
            </span>
          </div>

          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-x-4">
            <dt className="text-gray-500 dark:text-gray-400">교수</dt>
            <dd className="truncate">{professorText(course)}</dd>
            <dt className="text-gray-500 dark:text-gray-400">학과</dt>
            <dd className="truncate">{course.department?.name ?? "미지정"}</dd>
            <dt className="text-gray-500 dark:text-gray-400">학점</dt>
            <dd>{course.credits}학점</dd>
            <dt className="text-gray-500 dark:text-gray-400">이수구분</dt>
            <dd className="truncate">{course.categoryLabel}</dd>
          </dl>

          <ul className="mt-2 flex flex-wrap gap-1.5">
            {scheduleLines(course).map((line) => (
              <li
                key={line}
                className="bg-foreground/10 rounded px-2 py-0.5 font-mono text-xs text-gray-700 dark:text-gray-300"
              >
                {line}
              </li>
            ))}
          </ul>

          {schedulable ? null : (
            <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              강의시간 정보가 불완전해 자동 조합에 사용할 수 없습니다
            </p>
          )}
        </div>

        <BasketButton course={course} />
      </div>
    </li>
  );
}
