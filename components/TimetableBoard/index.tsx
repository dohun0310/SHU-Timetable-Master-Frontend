"use client";

import UnscheduledList from "@/components/UnscheduledList";
import { totalCredits } from "@/lib/timetable/credits";
import { blocksAt, buildGrid, isBlockStart, type GridBlock } from "@/lib/timetable/grid";
import { weekdayLabels, type Course } from "@/lib/timetable/types";
import { cn } from "@/lib/utils/cn";

const cellClass = "border border-gray-100 dark:border-gray-800";

function blockKey(block: GridBlock): string {
  const { course, meeting } = block;
  return `${course.id}-${meeting.day}-${meeting.startPeriod}`;
}

/**
 * 한 교시 칸에 놓이는 블록 하나. 시작 교시가 아닌 칸에서는 강좌명을 반복하지 않고
 * 이어짐 표시만 남긴다.
 */
function Block({
  block,
  period,
  onRemove,
}: {
  block: GridBlock;
  period: number;
  onRemove?: (courseId: string) => void;
}) {
  const { course, meeting, conflicted } = block;

  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col justify-start border px-1 py-0.5 text-2xs leading-tight",
        conflicted
          ? "border-red-400 bg-red-50 text-red-900 dark:border-red-700 dark:bg-red-900 dark:text-red-100"
          : "bg-foreground/10 border-transparent",
      )}
    >
      {isBlockStart(block, period) ? (
        <>
          <span className="flex items-start gap-0.5">
            <span className="min-w-0 flex-1 truncate font-medium">{course.name}</span>
            {onRemove ? (
              <button
                type="button"
                onClick={() => onRemove(course.id)}
                aria-label={`${course.name} 빼기`}
                className="hover:bg-foreground/20 shrink-0 rounded px-0.5"
              >
                ×
              </button>
            ) : null}
          </span>
          {meeting.location ? (
            <span
              className={cn(
                "truncate",
                conflicted ? "" : "text-gray-500 dark:text-gray-400",
              )}
            >
              {meeting.location}
            </span>
          ) : null}
        </>
      ) : (
        <span className={cn(conflicted ? "" : "text-gray-500 dark:text-gray-400")}>
          <span aria-hidden="true">↳</span>
          <span className="sr-only">{course.name} 이어짐</span>
        </span>
      )}
    </div>
  );
}

/**
 * 강좌 목록을 요일×교시 표로 그리는 표현 컴포넌트. 교시마다 칸을 하나씩 두고 `rowSpan`을 쓰지
 * 않으므로, 시작 교시가 다른 채 겹치는 강좌도 각자 자기 칸에 온전히 나타난다.
 */
export default function TimetableBoard({
  courses,
  onRemove,
}: {
  courses: Course[];
  onRemove?: (courseId: string) => void;
}) {
  const grid = buildGrid(courses);
  const conflicted = grid.blocks.some((block) => block.conflicted);

  return (
    <section className="bg-foreground/5 rounded-lg border border-gray-100 p-3 sm:p-4 dark:border-gray-800">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] table-fixed border-collapse">
          <caption className="sr-only">요일별 교시 시간표</caption>
          <thead>
            <tr>
              <th
                scope="col"
                className={cn(
                  cellClass,
                  "text-2xs w-9 py-1 font-medium text-gray-500 dark:text-gray-400",
                )}
              >
                교시
              </th>
              {grid.days.map((day) => (
                <th key={day} scope="col" className={cn(cellClass, "py-1 text-xs font-medium")}>
                  {weekdayLabels[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.periods.map((period) => (
              <tr key={period}>
                <th
                  scope="row"
                  className={cn(
                    cellClass,
                    "text-2xs font-medium text-gray-500 dark:text-gray-400",
                  )}
                >
                  {period}
                </th>
                {grid.days.map((day) => {
                  const blocks = blocksAt(grid, day, period);
                  return (
                    <td key={day} className={cn(cellClass, "bg-background h-10 p-0.5 align-top")}>
                      {blocks.length > 0 ? (
                        <div className="flex h-full gap-0.5">
                          {blocks.map((block) => (
                            <Block
                              key={blockKey(block)}
                              block={block}
                              period={period}
                              onRemove={onRemove}
                            />
                          ))}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">총 {totalCredits(courses)}학점</p>
        {conflicted ? (
          <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">
            겹치는 강좌가 있습니다
          </p>
        ) : null}
      </div>

      <UnscheduledList courses={grid.unscheduled} onRemove={onRemove} />
    </section>
  );
}
