import type { CourseQuery, CourseSort } from "./contracts/course-catalog";
import type { CourseCategory, Weekday } from "./timetable/types";

type RawParams = Record<string, string | string[] | undefined>;

export const defaultPageSize = 20;

function one(params: RawParams, key: string): string | undefined {
  const value = params[key];
  const found = Array.isArray(value) ? value[0] : value;
  return found && found.length > 0 ? found : undefined;
}

function many(params: RawParams, key: string): string[] | undefined {
  const value = params[key];
  const list = (Array.isArray(value) ? value : value ? [value] : [])
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
  return list.length > 0 ? list : undefined;
}

export interface ParsedCourseQuery {
  query: CourseQuery;
  /** 숫자로 읽을 수 없어 백엔드에 넘기지 못한 파라미터. 다른 조건과 똑같이 안내한다. */
  unreadableFields: string[];
}

/** 값의 타당성은 백엔드가 400으로 알려주므로 여기서는 형태만 맞춘다. */
export function parseCourseQuery(params: RawParams): ParsedCourseQuery {
  const unreadableFields: string[] = [];

  const number = (key: string): number | undefined => {
    const raw = one(params, key);
    if (raw === undefined) return undefined;
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) return parsed;
    unreadableFields.push(key);
    return undefined;
  };

  const query: CourseQuery = {
    q: one(params, "q"),
    categories: many(params, "category") as CourseCategory[] | undefined,
    departments: many(params, "department"),
    majors: many(params, "major"),
    professors: many(params, "professor"),
    days: many(params, "day") as Weekday[] | undefined,
    startAfter: one(params, "startAfter"),
    endBefore: one(params, "endBefore"),
    minCredits: number("minCredits"),
    maxCredits: number("maxCredits"),
    page: number("page") ?? 1,
    size: number("size") ?? defaultPageSize,
    sort: (one(params, "sort") as CourseSort | undefined) ?? "name",
  };

  return { query, unreadableFields };
}

/** 백엔드가 알려준 필드 이름(단수형 파라미터 이름)을 `CourseQuery`의 키로 옮긴다. */
const queryKeyByField: Record<string, keyof CourseQuery> = {
  q: "q",
  category: "categories",
  categories: "categories",
  department: "departments",
  departments: "departments",
  major: "majors",
  majors: "majors",
  professor: "professors",
  professors: "professors",
  day: "days",
  days: "days",
  startAfter: "startAfter",
  endBefore: "endBefore",
  minCredits: "minCredits",
  maxCredits: "maxCredits",
  page: "page",
  size: "size",
  sort: "sort",
};

const fieldLabels: Record<string, string> = {
  q: "검색어",
  categories: "이수구분",
  departments: "학과",
  majors: "전공",
  professors: "교수",
  days: "요일",
  startAfter: "시작 시각",
  endBefore: "종료 시각",
  minCredits: "최소 학점",
  maxCredits: "최대 학점",
  page: "페이지",
  size: "표시 개수",
  sort: "정렬",
};

/** 백엔드는 배열 항목을 `day.0`처럼 알려주므로 앞부분만 본다. */
function queryKeyOf(field: string): keyof CourseQuery | undefined {
  return queryKeyByField[field.split(/[.[]/)[0]];
}

/** 안내 문구에 쓸 한국어 이름. 모르는 필드는 원래 이름을 그대로 보여준다. */
export function invalidFieldLabel(field: string): string {
  const key = queryKeyOf(field);
  return (key && fieldLabels[key]) ?? field;
}

/** 백엔드가 거절한 조건만 빼고 다시 검색하기 위한 쿼리. 기본값이 있는 조건은 기본값으로 되돌린다. */
export function dropInvalidFields(query: CourseQuery, fields: string[]): CourseQuery {
  const next: CourseQuery = { ...query };
  for (const field of fields) {
    const key = queryKeyOf(field);
    if (!key) continue;
    delete next[key];
  }
  return {
    ...next,
    page: next.page ?? 1,
    size: next.size ?? defaultPageSize,
    sort: next.sort ?? "name",
  };
}
