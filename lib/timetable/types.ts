export const weekdays = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export type Weekday = (typeof weekdays)[number];

export const weekdayLabels: Record<Weekday, string> = {
  MONDAY: "월",
  TUESDAY: "화",
  WEDNESDAY: "수",
  THURSDAY: "목",
  FRIDAY: "금",
  SATURDAY: "토",
  SUNDAY: "일",
};

export type Semester = "FIRST" | "SECOND" | "SUMMER" | "WINTER";

export const semesterLabels: Record<Semester, string> = {
  FIRST: "1학기",
  SECOND: "2학기",
  SUMMER: "여름계절",
  WINTER: "겨울계절",
};

export type CourseCategory =
  | "BASIC_LIBERAL_ARTS"
  | "CORE_LIBERAL_ARTS"
  | "MICRO_DEGREE"
  | "MAJOR"
  | "TEACHING";

export type ParseStatus = "PARSED" | "PARTIALLY_PARSED" | "UNPARSED" | "NO_SCHEDULE";

export interface Organization {
  id: string;
  name: string;
}

export interface Meeting {
  day: Weekday;
  dayLabel: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
}

export interface CourseSchedule {
  raw: string;
  parseStatus: ParseStatus;
  meetings: Meeting[];
}

export interface Course {
  id: string;
  academicYear: number;
  semester: Semester;
  category: CourseCategory;
  categoryLabel: string;
  department: Organization | null;
  majors: Organization[];
  courseCode: string;
  classNumber: string;
  name: string;
  professors: string[];
  credits: number;
  hours: number;
  schedule: CourseSchedule;
}

export interface SemesterInfo {
  academicYear: number;
  semester: Semester;
}

/** `2026-SECOND` 형태. 저장본의 만료를 판정하는 유일한 기준이다. */
export type SemesterKey = string;

export interface Basket {
  id: string;
  label: string;
  required: boolean;
  courseIds: string[];
}

export interface Constraints {
  freeDays: Weekday[];
  avoidBefore: string | null;
  avoidAfter: string | null;
  minCredits: number | null;
  maxCredits: number | null;
}

export const emptyConstraints: Constraints = {
  freeDays: [],
  avoidBefore: null,
  avoidAfter: null,
  minCredits: null,
  maxCredits: null,
};

export interface Timetable {
  courses: Course[];
  totalCredits: number;
  days: Weekday[];
  freeDays: Weekday[];
}
