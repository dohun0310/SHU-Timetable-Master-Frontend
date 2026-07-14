"use client";

import { useBasket } from "@/components/BasketProvider";
import { weekdayLabels, weekdays, type Weekday } from "@/lib/timetable/types";
import { cn } from "@/lib/utils/cn";

const fieldClass =
  "bg-background w-full appearance-none rounded-md border border-gray-200 px-2.5 py-1.5 text-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none dark:border-gray-700";
const labelClass = "mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400";

/** 공강일은 주말을 뺀 월~금만 고른다. */
const selectableDays = weekdays.filter((day) => day !== "SATURDAY" && day !== "SUNDAY");

function toTime(value: string): string | null {
  return value.length > 0 ? value : null;
}

function toCredits(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export default function ConstraintsPanel() {
  const { constraints, setConstraints } = useBasket();
  const { minCredits, maxCredits } = constraints;
  const invalidRange = minCredits !== null && maxCredits !== null && minCredits > maxCredits;

  const toggleFreeDay = (day: Weekday) => {
    setConstraints((previous) => ({
      ...previous,
      freeDays: previous.freeDays.includes(day)
        ? previous.freeDays.filter((selected) => selected !== day)
        : [...previous.freeDays, day],
    }));
  };

  return (
    <section className="bg-foreground/5 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
      <h2 className="mb-3 text-sm font-semibold">조합 조건</h2>

      <fieldset>
        <legend className={labelClass}>공강일</legend>
        <div className="flex flex-wrap gap-1.5">
          {selectableDays.map((day) => {
            const selected = constraints.freeDays.includes(day);
            return (
              /**
               * iOS Safari는 더블탭 확대를 판별하려고 탭 후 클릭을 잠시 미루고, 그 사이에 다른
               * 칸을 누르면 클릭이 먼저 누른 요소로 합성된다. `touch-manipulation`으로 확대를
               * 꺼 지연을 없앤다. 숨긴 체크박스를 label이 대신 누르는 구조도 이 재타게팅에
               * 취약하므로 버튼으로 직접 다룬다.
               */
              <button
                key={day}
                type="button"
                onClick={() => toggleFreeDay(day)}
                aria-pressed={selected}
                className={cn(
                  "flex h-8 w-8 touch-manipulation items-center justify-center rounded-md border text-xs focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:outline-none",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-300",
                )}
              >
                {weekdayLabels[day]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass} htmlFor="constraint-avoid-before">
            이 시각 이전 회피
          </label>
          <input
            id="constraint-avoid-before"
            type="time"
            value={constraints.avoidBefore ?? ""}
            onChange={(event) =>
              setConstraints((previous) => ({ ...previous, avoidBefore: toTime(event.target.value) }))
            }
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="constraint-avoid-after">
            이 시각 이후 회피
          </label>
          <input
            id="constraint-avoid-after"
            type="time"
            value={constraints.avoidAfter ?? ""}
            onChange={(event) =>
              setConstraints((previous) => ({ ...previous, avoidAfter: toTime(event.target.value) }))
            }
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="constraint-min-credits">
            최소 학점
          </label>
          <input
            id="constraint-min-credits"
            type="number"
            min={0}
            max={30}
            value={constraints.minCredits ?? ""}
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? "constraint-credits-error" : undefined}
            onChange={(event) =>
              setConstraints((previous) => ({ ...previous, minCredits: toCredits(event.target.value) }))
            }
            className={fieldClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="constraint-max-credits">
            최대 학점
          </label>
          <input
            id="constraint-max-credits"
            type="number"
            min={0}
            max={30}
            value={constraints.maxCredits ?? ""}
            aria-invalid={invalidRange}
            aria-describedby={invalidRange ? "constraint-credits-error" : undefined}
            onChange={(event) =>
              setConstraints((previous) => ({ ...previous, maxCredits: toCredits(event.target.value) }))
            }
            className={fieldClass}
          />
        </div>
      </div>

      {invalidRange ? (
        <p
          id="constraint-credits-error"
          role="alert"
          className="mt-2 rounded border border-orange-300 bg-orange-50 px-2 py-1 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200"
        >
          최소 학점이 최대 학점보다 큽니다. 범위를 다시 확인해주세요.
        </p>
      ) : null}
    </section>
  );
}
