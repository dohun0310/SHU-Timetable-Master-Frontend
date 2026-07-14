import "server-only";

import type { CourseCatalog } from "../contracts/course-catalog";
import type { TimetableMaker } from "../contracts/timetable-maker";
import { HttpCourseCatalog } from "./http-course-catalog";
import { HttpTimetableMaker } from "./http-timetable-maker";

export function createCourseCatalog(): CourseCatalog {
  return new HttpCourseCatalog();
}

export function createTimetableMaker(): TimetableMaker {
  return new HttpTimetableMaker();
}
