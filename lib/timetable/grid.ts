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
  /** `blocksAt`으로 조회한다. 시작 교시에만 블록이 놓이고 endPeriod까지 세로로 병합된다. */
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

/** 이 칸에서 시작하는 블록들. 같은 요일·같은 교시에 여러 강좌가 겹칠 수 있으므로 목록이다. */
export function blocksAt(grid: Grid, day: Weekday, period: number): GridBlock[] {
  return grid.blocks.filter(
    (block) => block.meeting.day === day && block.meeting.startPeriod === period,
  );
}

/** 다른 블록이 위에서부터 덮고 있는 칸인지. 이 칸에서 시작하는 블록이 하나라도 있으면 덮인 칸이 아니다. */
export function isCoveredCell(grid: Grid, day: Weekday, period: number): boolean {
  if (blocksAt(grid, day, period).length > 0) return false;
  return grid.blocks.some(
    (block) =>
      block.meeting.day === day &&
      block.meeting.startPeriod < period &&
      block.meeting.endPeriod >= period,
  );
}

/** 이 칸에서 시작하는 블록들이 차지할 교시 수. 길이가 다른 블록이 겹치면 가장 긴 것을 따른다. */
export function spanAt(grid: Grid, day: Weekday, period: number): number {
  const blocks = blocksAt(grid, day, period);
  if (blocks.length === 0) return 1;
  return blocks.reduce(
    (span, block) => Math.max(span, block.meeting.endPeriod - block.meeting.startPeriod + 1),
    1,
  );
}
