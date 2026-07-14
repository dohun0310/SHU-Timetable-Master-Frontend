import { weekdayLabels, type Course, type Meeting } from "../timetable/types";

export function meetingText(meeting: Meeting): string {
  const day = weekdayLabels[meeting.day];
  const periods =
    meeting.startPeriod === meeting.endPeriod
      ? `${meeting.startPeriod}교시`
      : `${meeting.startPeriod}-${meeting.endPeriod}교시`;
  const time =
    meeting.startTime && meeting.endTime ? ` ${meeting.startTime}~${meeting.endTime}` : "";
  const location = meeting.location ? ` (${meeting.location})` : "";
  return `${day} ${periods}${time}${location}`;
}

export function scheduleLines(course: Course): string[] {
  const { meetings, raw } = course.schedule;
  if (meetings.length > 0) return meetings.map(meetingText);
  if (raw.trim().length > 0) return raw.split("\n").filter((line) => line.trim().length > 0);
  return ["시간 미지정"];
}

export function professorText(course: Course): string {
  return course.professors.length > 0 ? course.professors.join(", ") : "미정";
}
