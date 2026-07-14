import type { Course, Meeting } from "./types";

export function meetingsOverlap(left: Meeting, right: Meeting): boolean {
  if (left.day !== right.day) return false;
  return left.startPeriod <= right.endPeriod && right.startPeriod <= left.endPeriod;
}

export function coursesConflict(left: Course, right: Course): boolean {
  return left.schedule.meetings.some((leftMeeting) =>
    right.schedule.meetings.some((rightMeeting) => meetingsOverlap(leftMeeting, rightMeeting)),
  );
}

/** 서로 겹치는 강좌 id 쌍. 보드에서 어떤 칸을 빨갛게 칠할지 정하는 데 쓴다. */
export function conflictingPairs(courses: Course[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < courses.length; i += 1) {
    for (let j = i + 1; j < courses.length; j += 1) {
      const left = courses[i];
      const right = courses[j];
      if (coursesConflict(left, right)) pairs.push([left.id, right.id]);
    }
  }
  return pairs;
}

export function conflictingCourseIds(courses: Course[]): Set<string> {
  const ids = new Set<string>();
  for (const [left, right] of conflictingPairs(courses)) {
    ids.add(left);
    ids.add(right);
  }
  return ids;
}
