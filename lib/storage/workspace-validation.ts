import type { SavedTimetable, Workspace } from "../contracts/timetable-shelf";
import {
  emptyConstraints,
  weekdays,
  type Basket,
  type Constraints,
  type Course,
  type ParseStatus,
} from "../timetable/types";

const parseStatuses: readonly ParseStatus[] = [
  "PARSED",
  "PARTIALLY_PARSED",
  "UNPARSED",
  "NO_SCHEDULE",
];

/**
 * localStorage는 사용자가 직접 고칠 수 있고 예전 버전이 남길 수도 있다.
 * JSON으로 파싱된다는 것만으로는 화면이 기대하는 모양임을 보장하지 못하므로 원소 단위까지 확인한다.
 * 어긋나는 저장본은 부분 복구하지 않고 통째로 버린다.
 */

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNullableString(value: unknown): boolean {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): boolean {
  return value === null || typeof value === "number";
}

function isWeekday(value: unknown): boolean {
  return typeof value === "string" && (weekdays as readonly string[]).includes(value);
}

function isMeeting(value: unknown): boolean {
  return (
    isRecord(value) &&
    isWeekday(value.day) &&
    typeof value.startPeriod === "number" &&
    typeof value.endPeriod === "number"
  );
}

function isOrganization(value: unknown): boolean {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string";
}

function isDepartment(value: unknown): boolean {
  return value === null || isOrganization(value);
}

function isParseStatus(value: unknown): boolean {
  return typeof value === "string" && (parseStatuses as readonly string[]).includes(value);
}

function isCourse(value: unknown): value is Course {
  if (!isRecord(value)) return false;
  const { schedule } = value;
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.courseCode === "string" &&
    typeof value.classNumber === "string" &&
    typeof value.credits === "number" &&
    isDepartment(value.department) &&
    isStringArray(value.professors) &&
    isRecord(schedule) &&
    typeof schedule.raw === "string" &&
    isParseStatus(schedule.parseStatus) &&
    Array.isArray(schedule.meetings) &&
    schedule.meetings.every(isMeeting)
  );
}

function isBasket(value: unknown): value is Basket {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    typeof value.required === "boolean" &&
    isStringArray(value.courseIds) &&
    value.courseIds.length > 0
  );
}

function isCourseMap(value: unknown): value is Record<string, Course> {
  return isRecord(value) && Object.values(value).every(isCourse);
}

function isConstraints(value: unknown): value is Constraints {
  return (
    isRecord(value) &&
    isStringArray(value.freeDays) &&
    isNullableString(value.avoidBefore) &&
    isNullableString(value.avoidAfter) &&
    isNullableNumber(value.minCredits) &&
    isNullableNumber(value.maxCredits)
  );
}

/** 바구니가 가리키는 모든 courseId가 courses에 실제로 존재해야 한다. 유령 바구니는 통째로 버린다. */
function hasConsistentReferences(baskets: Basket[], courses: Record<string, Course>): boolean {
  return baskets.every((basket) => basket.courseIds.every((courseId) => courseId in courses));
}

/** 모양이 어긋나면 null. 조합 조건만 어긋나면 빈 조건으로 대체하고 바구니는 살린다. */
export function parseWorkspace(value: unknown): Workspace | null {
  if (!isRecord(value)) return null;
  if (typeof value.semesterKey !== "string") return null;
  if (!Array.isArray(value.baskets) || !value.baskets.every(isBasket)) return null;
  if (!isCourseMap(value.courses)) return null;
  if (!hasConsistentReferences(value.baskets, value.courses)) return null;

  return {
    semesterKey: value.semesterKey,
    baskets: value.baskets,
    courses: value.courses,
    constraints: isConstraints(value.constraints)
      ? { ...emptyConstraints, ...value.constraints }
      : emptyConstraints,
  };
}

function isSavedTimetable(value: unknown): value is SavedTimetable {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.savedAt === "string" &&
    typeof value.semesterKey === "string" &&
    Array.isArray(value.courses) &&
    value.courses.every(isCourse)
  );
}

/** 하나라도 어긋나면 목록 전체를 버린다. */
export function parseSavedTimetables(value: unknown): SavedTimetable[] {
  if (!Array.isArray(value) || !value.every(isSavedTimetable)) return [];
  return value;
}
