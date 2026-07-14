"use client";

import type { Course } from "@/lib/timetable/types";
import { professorText } from "@/lib/utils/course-format";

/** 강의시간이 없는 강좌(사이버 강의 등)는 그리드에 자리가 없으므로 표 밖에 따로 적는다. */
export default function UnscheduledList({
  courses,
  onRemove,
}: {
  courses: Course[];
  onRemove?: (courseId: string) => void;
}) {
  if (courses.length === 0) return null;

  return (
    <section className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-800">
      <h3 className="text-xs font-semibold">시간 미지정</h3>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {courses.map((course) => (
          <li
            key={course.id}
            className="bg-foreground/10 flex items-center gap-1.5 rounded px-2 py-1 text-xs"
          >
            <span className="font-medium">{course.name}</span>
            <span className="text-gray-500 dark:text-gray-400">
              {course.classNumber}분반 · {professorText(course)} · {course.credits}학점
            </span>
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(course.id)}
                aria-label={`${course.name} 빼기`}
                className="hover:bg-foreground/10 rounded px-1 text-gray-500 dark:text-gray-400"
              >
                ×
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
