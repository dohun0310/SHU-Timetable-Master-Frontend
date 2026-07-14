import type { Course } from "./types";

/**
 * 자동 조합에 쓸 수 있는 강좌인지. 백엔드는 PARTIALLY_PARSED·UNPARSED를 400으로 거부하므로
 * 바구니에 담는 시점에 미리 알려주기 위해 같은 규칙을 여기서도 판정한다.
 */
export function isSchedulable(course: Course): boolean {
  const status = course.schedule.parseStatus;
  return status === "PARSED" || status === "NO_SCHEDULE";
}

export function unschedulableCourses(courses: Course[]): Course[] {
  return courses.filter((course) => !isSchedulable(course));
}
