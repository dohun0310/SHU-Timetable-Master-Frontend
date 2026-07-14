import Link from "next/link";
import { Suspense } from "react";

import CourseList, { CourseListSkeleton } from "@/components/CourseList";
import Pagination from "@/components/Pagination";
import SearchFilters from "@/components/SearchFilters";
import { createCourseCatalog } from "@/lib/catalog";
import type {
  CatalogFilters,
  CourseCatalog,
  CoursePage,
  CourseQuery,
} from "@/lib/contracts/course-catalog";
import { CatalogUnavailableError, InvalidQueryError } from "@/lib/contracts/errors";
import { dropInvalidFields, invalidFieldLabel, parseCourseQuery } from "@/lib/search-params";

function CatalogUnavailable() {
  return (
    <div className="bg-foreground/5 rounded-lg border border-gray-100 p-10 text-center dark:border-gray-800">
      <h2 className="text-base font-semibold">강좌 정보를 불러오지 못했습니다</h2>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        잠시 후 다시 시도해주세요. 저장한 시간표는 지금도 확인할 수 있습니다.
      </p>
      <Link
        href="/my"
        className="bg-foreground text-background hover:bg-foreground/85 mt-4 inline-block rounded-md px-4 py-2 text-sm font-medium"
      >
        내 시간표 보기
      </Link>
    </div>
  );
}

interface SearchOutcome {
  page: CoursePage | null;
  droppedFields: string[];
}

/** 백엔드가 거절한 조건만 빼고 다시 검색한다. 화면 전체를 에러로 덮지 않는다. */
async function searchDroppingInvalidFields(
  catalog: CourseCatalog,
  query: CourseQuery,
): Promise<SearchOutcome> {
  const droppedFields: string[] = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const page = await catalog.search(dropInvalidFields(query, droppedFields));
      return { page, droppedFields };
    } catch (error) {
      if (!(error instanceof InvalidQueryError)) throw error;
      const next = error.issues.map((issue) => issue.field).filter((field) => field.length > 0);
      if (next.length === 0) break;
      droppedFields.push(...next);
    }
  }

  return { page: null, droppedFields };
}

async function SearchResults({
  catalog,
  query,
  unreadableFields,
}: {
  catalog: CourseCatalog;
  query: CourseQuery;
  unreadableFields: string[];
}) {
  let page: CoursePage | null;
  let droppedFields: string[];
  try {
    ({ page, droppedFields } = await searchDroppingInvalidFields(catalog, query));
  } catch (error) {
    if (error instanceof CatalogUnavailableError) return <CatalogUnavailable />;
    throw error;
  }

  const droppedLabels = Array.from(
    new Set([...unreadableFields, ...droppedFields].map(invalidFieldLabel)),
  );

  if (!page) {
    return (
      <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        검색 조건이 올바르지 않아 결과를 불러오지 못했습니다. 조건을 초기화하고 다시 검색해주세요.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {droppedLabels.length > 0 ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          다음 조건은 사용할 수 없어 제외했습니다: {droppedLabels.join(", ")}
        </p>
      ) : null}
      <CourseList page={page} />
      <Pagination page={page.page} totalPages={page.totalPages} />
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { query, unreadableFields } = parseCourseQuery(params);
  const catalog = createCourseCatalog();

  let filters: CatalogFilters | null = null;
  try {
    filters = (await catalog.meta()).filters;
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) throw error;
  }

  if (!filters) return <CatalogUnavailable />;

  return (
    <div className="flex flex-col gap-4">
      <SearchFilters filters={filters} />
      <Suspense key={JSON.stringify(query)} fallback={<CourseListSkeleton />}>
        <SearchResults catalog={catalog} query={query} unreadableFields={unreadableFields} />
      </Suspense>
    </div>
  );
}
