import { isSchedulable } from "@/lib/timetable/schedulability";
import { weekdayLabels, type Course, type Meeting } from "@/lib/timetable/types";

function meetingText(meeting: Meeting): string {
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

function scheduleLines(course: Course): string[] {
  const { meetings, raw } = course.schedule;
  if (meetings.length > 0) return meetings.map(meetingText);
  if (raw.trim().length > 0) return raw.split("\n").filter((line) => line.trim().length > 0);
  return ["시간 미지정"];
}

export default function CourseCard({ course }: { course: Course }) {
  const schedulable = isSchedulable(course);
  const professors = course.professors.length > 0 ? course.professors.join(", ") : "미정";

  return (
    <li className="bg-foreground/5 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <h3 className="text-base font-semibold">{course.name}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {course.classNumber}분반 · {course.courseCode}
            </span>
          </div>

          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm sm:grid-cols-[auto_1fr_auto_1fr] sm:gap-x-4">
            <dt className="text-gray-500 dark:text-gray-400">교수</dt>
            <dd className="truncate">{professors}</dd>
            <dt className="text-gray-500 dark:text-gray-400">학과</dt>
            <dd className="truncate">{course.department?.name ?? "미지정"}</dd>
            <dt className="text-gray-500 dark:text-gray-400">학점</dt>
            <dd>{course.credits}학점</dd>
            <dt className="text-gray-500 dark:text-gray-400">이수구분</dt>
            <dd className="truncate">{course.categoryLabel}</dd>
          </dl>

          <ul className="mt-2 flex flex-wrap gap-1.5">
            {scheduleLines(course).map((line) => (
              <li
                key={line}
                className="bg-foreground/10 rounded px-2 py-0.5 font-mono text-xs text-gray-700 dark:text-gray-300"
              >
                {line}
              </li>
            ))}
          </ul>

          {schedulable ? null : (
            <p className="mt-2 rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              강의시간 정보가 불완전해 자동 조합에 사용할 수 없습니다
            </p>
          )}
        </div>

        <button
          type="button"
          disabled
          title="바구니는 곧 지원될 예정입니다"
          className="shrink-0 cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-400 dark:border-gray-700 dark:text-gray-600"
        >
          바구니에 담기
        </button>
      </div>
    </li>
  );
}
