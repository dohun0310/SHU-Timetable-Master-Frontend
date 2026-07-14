import { conflictingCourseIds } from "./conflict";
import { weekdays, type Course, type Meeting, type Weekday } from "./types";

export interface GridBlock {
  course: Course;
  meeting: Meeting;
  conflicted: boolean;
}

export interface Grid {
  days: Weekday[];
  periods: number[];
  /** `blockAt`으로 조회한다. 시작 교시에만 블록이 놓이고 endPeriod까지 세로로 병합된다. */
  blocks: GridBlock[];
  unscheduled: Course[];
}

const defaultDays: Weekday[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const minPeriod = 1;
const defaultLastPeriod = 9;

export function buildGrid(courses: Course[]): Grid {
  const meetings = courses.flatMap((course) => course.schedule.meetings);
  const conflicted = conflictingCourseIds(courses);

  const usedDays = new Set(meetings.map((meeting) => meeting.day));
  const days = weekdays.filter(
    (day) => defaultDays.includes(day) || usedDays.has(day),
  );

  const lastPeriod = meetings.reduce(
    (last, meeting) => Math.max(last, meeting.endPeriod),
    defaultLastPeriod,
  );
  const periods = Array.from(
    { length: lastPeriod - minPeriod + 1 },
    (_, index) => minPeriod + index,
  );

  const blocks = courses.flatMap((course) =>
    course.schedule.meetings.map((meeting) => ({
      course,
      meeting,
      conflicted: conflicted.has(course.id),
    })),
  );

  const unscheduled = courses.filter((course) => course.schedule.meetings.length === 0);

  return { days, periods, blocks, unscheduled };
}

export function blockAt(grid: Grid, day: Weekday, period: number): GridBlock | null {
  return (
    grid.blocks.find(
      (block) => block.meeting.day === day && block.meeting.startPeriod === period,
    ) ?? null
  );
}

/** 다른 블록이 이미 차지한 칸인지. 시작 교시가 아닌 중간 칸은 렌더링하지 않는다. */
export function isCoveredCell(grid: Grid, day: Weekday, period: number): boolean {
  return grid.blocks.some(
    (block) =>
      block.meeting.day === day &&
      block.meeting.startPeriod < period &&
      block.meeting.endPeriod >= period,
  );
}
