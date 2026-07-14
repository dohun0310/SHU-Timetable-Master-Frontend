"use client";

import { useState } from "react";

import { useBasket } from "@/components/BasketProvider";
import type { SweepReport } from "@/lib/storage/shelf-capabilities";
import { isSchedulable } from "@/lib/timetable/schedulability";
import type { Basket, Course } from "@/lib/timetable/types";
import { professorText, scheduleLines } from "@/lib/utils/course-format";
import { cn } from "@/lib/utils/cn";

function BasketSection({
  course,
  onRemove,
}: {
  course: Course;
  onRemove: () => void;
}) {
  return (
    <li className="bg-background rounded border border-gray-100 px-2.5 py-2 dark:border-gray-800">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">
            {course.classNumber}분반 · {professorText(course)}
          </p>
          <p className="mt-0.5 truncate font-mono text-2xs text-gray-500 dark:text-gray-400">
            {scheduleLines(course).join(" / ")}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${course.name} ${course.classNumber}분반 빼기`}
          className="hover:bg-foreground/10 shrink-0 rounded px-1.5 py-0.5 text-xs text-gray-500 dark:text-gray-400"
        >
          빼기
        </button>
      </div>
      {isSchedulable(course) ? null : (
        <p className="mt-1.5 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-2xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          강의시간 정보가 불완전해 자동 조합에 쓸 수 없습니다
        </p>
      )}
    </li>
  );
}

/** 이름이 같고 코드가 다른 과목이 실제로 존재하므로 이름만으로는 바구니를 구별할 수 없다. */
function subjectText(sections: Course[]): string {
  const [first] = sections;
  if (!first) return "";
  return [first.courseCode, first.department?.name].filter(Boolean).join(" · ");
}

function BasketItem({ basket }: { basket: Basket }) {
  const { courses, removeBasket, removeCourse, toggleRequired } = useBasket();
  const [open, setOpen] = useState(false);
  const sections = basket.courseIds
    .map((courseId) => courses[courseId])
    .filter((course): course is Course => Boolean(course));
  const hasWarning = sections.some((course) => !isSchedulable(course));
  const subject = subjectText(sections);
  const basketName = subject.length > 0 ? `${basket.label} (${subject})` : basket.label;

  return (
    <li className="rounded-md border border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium">{basket.label}</span>
            {hasWarning ? (
              <span className="shrink-0 rounded bg-amber-50 px-1 text-2xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                주의
              </span>
            ) : null}
          </span>
          {subject.length > 0 ? (
            <span className="mt-0.5 block truncate text-2xs text-gray-500 dark:text-gray-400">
              {subject}
            </span>
          ) : null}
          <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
            분반 {sections.length}개 · {open ? "접기" : "펼치기"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleRequired(basket.id)}
          aria-pressed={basket.required}
          className={cn(
            "shrink-0 rounded px-2 py-1 text-xs font-medium",
            basket.required
              ? "bg-foreground text-background"
              : "border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400",
          )}
        >
          필수
        </button>
        <button
          type="button"
          onClick={() => removeBasket(basket.id)}
          aria-label={`${basketName} 바구니 삭제`}
          className="hover:bg-foreground/10 shrink-0 rounded px-1.5 py-1 text-xs text-gray-500 dark:text-gray-400"
        >
          삭제
        </button>
      </div>

      {open ? (
        <ul className="flex flex-col gap-1.5 px-2.5 pb-2.5">
          {sections.map((course) => (
            <BasketSection
              key={course.id}
              course={course}
              onRemove={() => removeCourse(basket.id, course.id)}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** 정리된 대상에 맞는 문구만 내보낸다. 바구니가 멀쩡한데 정리했다고 하면 안 된다. */
function sweptText(swept: SweepReport): string | null {
  if (swept.workspace && swept.timetables) {
    return "지난 학기의 바구니와 저장된 시간표를 정리했습니다.";
  }
  if (swept.workspace) return "지난 학기의 바구니라 정리했습니다.";
  if (swept.timetables) return "지난 학기의 저장된 시간표를 정리했습니다.";
  return null;
}

export default function BasketPanel() {
  const { baskets, swept, canPersist } = useBasket();
  const requiredCount = baskets.filter((basket) => basket.required).length;
  const sweptNotice = sweptText(swept);

  return (
    <section className="bg-foreground/5 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">바구니</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          총 {baskets.length}개 · 필수 {requiredCount}개
        </p>
      </div>

      {sweptNotice ? (
        <p
          role="status"
          className="mb-3 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          {sweptNotice}
        </p>
      ) : null}

      {canPersist ? null : (
        <p
          role="status"
          className="mb-3 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          이 브라우저에서는 바구니가 저장되지 않습니다. 탭을 닫으면 사라집니다.
        </p>
      )}

      {baskets.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-200 px-3 py-6 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
          담은 강좌가 없습니다. 듣고 싶은 강좌를 바구니에 담아보세요.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {baskets.map((basket) => (
            <BasketItem key={basket.id} basket={basket} />
          ))}
        </ul>
      )}
    </section>
  );
}
