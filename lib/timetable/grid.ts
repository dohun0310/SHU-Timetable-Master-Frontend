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
  /** `blocksAt`으로 조회한다. 교시마다 한 칸씩 그리며, 블록은 자신이 점유하는 모든 교시에 나타난다. */
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

/** 이 교시를 점유하는 블록들. 시작 교시가 달라도 겹칠 수 있으므로 목록이다. */
export function blocksAt(grid: Grid, day: Weekday, period: number): GridBlock[] {
  return grid.blocks.filter(
    (block) =>
      block.meeting.day === day &&
      block.meeting.startPeriod <= period &&
      block.meeting.endPeriod >= period,
  );
}

/** 이 블록이 시작하는 칸인지. 이어지는 칸에서는 강좌명을 반복해 적지 않는다. */
export function isBlockStart(block: GridBlock, period: number): boolean {
  return block.meeting.startPeriod === period;
}
