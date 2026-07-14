"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { CatalogFilter, CatalogFilters } from "@/lib/contracts/course-catalog";
import { weekdayLabels, weekdays } from "@/lib/timetable/types";

const sortOptions: Array<{ value: string; label: string }> = [
  { value: "name", label: "강좌명순" },
  { value: "credits", label: "학점순" },
];

/**
 * 전공(100여 개)·교수(400여 개)는 `<select>`로 늘어놓으면 찾기가 어려워
 * 입력하면서 좁혀지는 `<datalist>` 자동완성으로 다룬다. 표시는 label, 전송은 id.
 */
function useLabelIndex(options: CatalogFilter[]) {
  return useMemo(() => {
    const idToLabel = new Map(options.map((option) => [option.id, option.label]));
    const labelToId = new Map(options.map((option) => [option.label.toLowerCase(), option.id]));
    return { idToLabel, labelToId };
  }, [options]);
}

function fieldClass(): string {
  return "w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
}

function labelClass(): string {
  return "mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400";
}

export default function SearchFilters({ filters }: { filters: CatalogFilters }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [unknownFields, setUnknownFields] = useState<string[]>([]);

  const majorIndex = useLabelIndex(filters.majors);
  const professorIndex = useLabelIndex(filters.professors);

  const listOf = (key: string): string[] =>
    searchParams
      .getAll(key)
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter(Boolean);

  const selectedCategories = listOf("category");
  const selectedDays = listOf("day");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const unknown: string[] = [];

    const put = (key: string, value: FormDataEntryValue | null) => {
      const text = typeof value === "string" ? value.trim() : "";
      if (text) params.set(key, text);
    };
    const putAll = (key: string, values: FormDataEntryValue[]) => {
      const list = values.filter((value): value is string => typeof value === "string");
      if (list.length > 0) params.set(key, list.join(","));
    };
    const putByLabel = (
      key: string,
      fieldLabel: string,
      index: ReturnType<typeof useLabelIndex>,
    ) => {
      const raw = form.get(key);
      const text = typeof raw === "string" ? raw.trim() : "";
      if (!text) return;
      const id = index.labelToId.get(text.toLowerCase());
      if (id) params.set(key, id);
      else unknown.push(fieldLabel);
    };

    put("q", form.get("q"));
    putAll("category", form.getAll("category"));
    put("department", form.get("department"));
    putByLabel("major", "전공", majorIndex);
    putByLabel("professor", "교수", professorIndex);
    putAll("day", form.getAll("day"));
    put("startAfter", form.get("startAfter"));
    put("endBefore", form.get("endBefore"));
    put("minCredits", form.get("minCredits"));
    put("maxCredits", form.get("maxCredits"));
    const sort = form.get("sort");
    if (typeof sort === "string" && sort !== "name") params.set("sort", sort);

    setUnknownFields(unknown);
    setOpen(false);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  const handleReset = () => {
    setUnknownFields([]);
    router.push("/");
  };

  const activeCount = Array.from(searchParams.keys()).filter(
    (key) => key !== "page" && key !== "sort",
  ).length;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between md:mb-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">검색 조건</h2>
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          aria-expanded={open}
          className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-600 md:hidden dark:border-zinc-700 dark:text-zinc-300"
        >
          {open ? "접기" : `펼치기${activeCount > 0 ? ` (${activeCount})` : ""}`}
        </button>
      </div>

      {/* 패널이 접혀도 보여야 하므로 form 바깥에 둔다. */}
      {unknownFields.length > 0 ? (
        <p
          role="status"
          className="mt-3 mb-3 text-xs text-amber-700 md:mt-0 dark:text-amber-300"
        >
          목록에 없는 값이라 {unknownFields.join(", ")} 조건은 적용하지 않았습니다. 자동완성
          목록에서 골라주세요.
        </p>
      ) : null}

      <form
        key={searchParams.toString()}
        onSubmit={handleSubmit}
        className={`${open ? "block" : "hidden"} md:block`}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className={labelClass()} htmlFor="filter-q">
              검색어
            </label>
            <input
              id="filter-q"
              name="q"
              type="search"
              defaultValue={searchParams.get("q") ?? ""}
              placeholder="강좌명, 과목코드, 교수명"
              className={fieldClass()}
            />
          </div>

          <div>
            <label className={labelClass()} htmlFor="filter-department">
              학과
            </label>
            <select
              id="filter-department"
              name="department"
              defaultValue={searchParams.get("department") ?? ""}
              className={fieldClass()}
            >
              <option value="">전체</option>
              {filters.departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.label} ({department.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass()} htmlFor="filter-sort">
              정렬
            </label>
            <select
              id="filter-sort"
              name="sort"
              defaultValue={searchParams.get("sort") ?? "name"}
              className={fieldClass()}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass()} htmlFor="filter-major">
              전공 (입력해 검색)
            </label>
            <input
              id="filter-major"
              name="major"
              list="major-options"
              defaultValue={majorIndex.idToLabel.get(searchParams.get("major") ?? "") ?? ""}
              placeholder="예: 소프트웨어융합학과"
              className={fieldClass()}
            />
            <datalist id="major-options">
              {filters.majors.map((major) => (
                <option key={major.id} value={major.label} />
              ))}
            </datalist>
          </div>

          <div>
            <label className={labelClass()} htmlFor="filter-professor">
              교수 (입력해 검색)
            </label>
            <input
              id="filter-professor"
              name="professor"
              list="professor-options"
              defaultValue={
                professorIndex.idToLabel.get(searchParams.get("professor") ?? "") ?? ""
              }
              placeholder="예: 홍길동"
              className={fieldClass()}
            />
            <datalist id="professor-options">
              {filters.professors.map((professor) => (
                <option key={professor.id} value={professor.label} />
              ))}
            </datalist>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass()} htmlFor="filter-start-after">
                시작 시각 이후
              </label>
              <input
                id="filter-start-after"
                name="startAfter"
                type="time"
                defaultValue={searchParams.get("startAfter") ?? ""}
                className={fieldClass()}
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="filter-end-before">
                종료 시각 이전
              </label>
              <input
                id="filter-end-before"
                name="endBefore"
                type="time"
                defaultValue={searchParams.get("endBefore") ?? ""}
                className={fieldClass()}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass()} htmlFor="filter-min-credits">
                최소 학점
              </label>
              <input
                id="filter-min-credits"
                name="minCredits"
                type="number"
                min={0}
                max={30}
                defaultValue={searchParams.get("minCredits") ?? ""}
                className={fieldClass()}
              />
            </div>
            <div>
              <label className={labelClass()} htmlFor="filter-max-credits">
                최대 학점
              </label>
              <input
                id="filter-max-credits"
                name="maxCredits"
                type="number"
                min={0}
                max={30}
                defaultValue={searchParams.get("maxCredits") ?? ""}
                className={fieldClass()}
              />
            </div>
          </div>
        </div>

        <fieldset className="mt-3">
          <legend className={labelClass()}>이수구분</legend>
          <div className="flex flex-wrap gap-1.5">
            {filters.categories.map((category) => (
              <label
                key={category.id}
                className="flex cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 has-focus-visible:ring-2 has-focus-visible:ring-zinc-500 has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:text-zinc-300 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
              >
                <input
                  type="checkbox"
                  name="category"
                  value={category.id}
                  defaultChecked={selectedCategories.includes(category.id)}
                  className="sr-only"
                />
                {category.label} ({category.count})
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-3">
          <legend className={labelClass()}>요일</legend>
          <div className="flex flex-wrap gap-1.5">
            {weekdays.map((day) => (
              <label
                key={day}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-zinc-300 text-xs text-zinc-700 has-focus-visible:ring-2 has-focus-visible:ring-zinc-500 has-checked:border-zinc-900 has-checked:bg-zinc-900 has-checked:text-white dark:border-zinc-700 dark:text-zinc-300 dark:has-checked:border-zinc-100 dark:has-checked:bg-zinc-100 dark:has-checked:text-zinc-900"
              >
                <input
                  type="checkbox"
                  name="day"
                  value={day}
                  defaultChecked={selectedDays.includes(day)}
                  className="sr-only"
                />
                {weekdayLabels[day]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex gap-2">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            검색
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            초기화
          </button>
        </div>
      </form>
    </section>
  );
}
