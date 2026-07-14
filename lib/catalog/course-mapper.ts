import "server-only";

import type { Course, CourseSchedule, Meeting } from "../timetable/types";

interface BackendMeeting {
  day: Meeting["day"];
  dayLabel: string;
  startPeriod: number;
  endPeriod: number;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
}

interface BackendSchedule {
  raw: string;
  parseStatus: CourseSchedule["parseStatus"];
  meetings: BackendMeeting[];
}

/** 백엔드가 실제로 내려주는 강좌 응답. `source`(수집 메타데이터) 같은 도메인 밖 필드가 섞여 있다. */
export interface BackendCourse {
  id: string;
  academicYear: number;
  semester: Course["semester"];
  category: Course["category"];
  categoryLabel: string;
  department: Course["department"];
  majors: Course["majors"];
  courseCode: string;
  classNumber: string;
  name: string;
  professors: string[];
  credits: number;
  hours: number;
  schedule: BackendSchedule;
  source?: unknown;
}

function toMeeting(raw: BackendMeeting): Meeting {
  return {
    day: raw.day,
    dayLabel: raw.dayLabel,
    startPeriod: raw.startPeriod,
    endPeriod: raw.endPeriod,
    startTime: raw.startTime,
    endTime: raw.endTime,
    location: raw.location,
  };
}

/** 백엔드 응답에는 수집 메타데이터(`source`) 같은 도메인 밖 필드가 섞여 있다. 도메인이 아는 필드만 옮겨 담는다. */
export function toCourse(raw: BackendCourse): Course {
  return {
    id: raw.id,
    academicYear: raw.academicYear,
    semester: raw.semester,
    category: raw.category,
    categoryLabel: raw.categoryLabel,
    department: raw.department,
    majors: raw.majors,
    courseCode: raw.courseCode,
    classNumber: raw.classNumber,
    name: raw.name,
    professors: raw.professors,
    credits: raw.credits,
    hours: raw.hours,
    schedule: {
      raw: raw.schedule.raw,
      parseStatus: raw.schedule.parseStatus,
      meetings: raw.schedule.meetings.map(toMeeting),
    },
  };
}
