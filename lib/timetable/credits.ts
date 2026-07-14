import type { Course } from "./types";

export function totalCredits(courses: Course[]): number {
  return courses.reduce((sum, course) => sum + course.credits, 0);
}
