import "server-only";

import type {
  CatalogFilter,
  CatalogFilters,
  CatalogMeta,
  CourseCatalog,
  CoursePage,
  CourseQuery,
} from "../contracts/course-catalog";
import type { Course, SemesterInfo } from "../timetable/types";
import { backendGet, NotFoundError } from "./backend-client";
import { toCourse, type BackendCourse } from "./course-mapper";

interface BackendCatalogFilter {
  id: string;
  label: string;
  count: number;
}

interface BackendCatalogFilters {
  categories: BackendCatalogFilter[];
  departments: BackendCatalogFilter[];
  majors: BackendCatalogFilter[];
  professors: BackendCatalogFilter[];
  days: BackendCatalogFilter[];
}

interface MetaResponse {
  meta: { academicYear: number; semester: SemesterInfo["semester"]; courseCount: number };
  filters: BackendCatalogFilters;
}

function toCatalogFilter(raw: BackendCatalogFilter): CatalogFilter {
  return {
    id: raw.id,
    label: raw.label,
    count: raw.count,
  };
}

/** 필터 목록도 백엔드 형태를 그대로 넘기지 않고 도메인 타입으로 정제한다. */
function toCatalogFilters(raw: BackendCatalogFilters): CatalogFilters {
  return {
    categories: raw.categories.map(toCatalogFilter),
    departments: raw.departments.map(toCatalogFilter),
    majors: raw.majors.map(toCatalogFilter),
    professors: raw.professors.map(toCatalogFilter),
    days: raw.days.map(toCatalogFilter),
  };
}

interface BackendCoursePage extends Omit<CoursePage, "courses"> {
  courses: BackendCourse[];
}

function toSearchParams(query: CourseQuery): string {
  const params = new URLSearchParams();
  const put = (key: string, value: string | number | undefined) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  };
  const putAll = (key: string, values: string[] | undefined) => {
    if (values && values.length > 0) params.set(key, values.join(","));
  };

  put("q", query.q);
  putAll("category", query.categories);
  putAll("department", query.departments);
  putAll("major", query.majors);
  putAll("professor", query.professors);
  putAll("day", query.days);
  put("startAfter", query.startAfter);
  put("endBefore", query.endBefore);
  put("minCredits", query.minCredits);
  put("maxCredits", query.maxCredits);
  put("page", query.page);
  put("size", query.size);
  put("sort", query.sort);

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export class HttpCourseCatalog implements CourseCatalog {
  async search(query: CourseQuery): Promise<CoursePage> {
    const page = await backendGet<BackendCoursePage>(
      `/api/courses${toSearchParams(query)}`,
      300,
    );
    return { ...page, courses: page.courses.map(toCourse) };
  }

  async findById(id: string): Promise<Course | null> {
    try {
      const raw = await backendGet<BackendCourse>(`/api/courses/${encodeURIComponent(id)}`, 300);
      return toCourse(raw);
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }

  async meta(): Promise<CatalogMeta> {
    const response = await backendGet<MetaResponse>("/api/meta", 300);
    return {
      semester: {
        academicYear: response.meta.academicYear,
        semester: response.meta.semester,
      },
      courseCount: response.meta.courseCount,
      filters: toCatalogFilters(response.filters),
    };
  }
}
