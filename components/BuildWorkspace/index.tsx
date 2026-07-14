"use client";

import { useState, useTransition } from "react";

import { generateTimetables } from "@/app/build/actions";
import { useBasket } from "@/components/BasketProvider";
import CandidateNav from "@/components/CandidateNav";
import TimetableBoard from "@/components/TimetableBoard";
import type { GenerateResult } from "@/lib/contracts/timetable-maker";
import { unschedulableCourses } from "@/lib/timetable/schedulability";
import {
  weekdayLabels,
  type Constraints,
  type Course,
  type SemesterKey,
} from "@/lib/timetable/types";

const candidateLimit = 20;

type Feedback =
  | { kind: "unschedulable"; courses: Course[] }
  | { kind: "empty" }
  | { kind: "invalid" | "unavailable"; message: string };

/** 결과가 0개일 때 무엇을 풀어야 할지 알려주려면 지금 걸린 제약을 그대로 보여줘야 한다. */
function constraintLines(constraints: Constraints): string[] {
  const lines: string[] = [];
  if (constraints.freeDays.length > 0) {
    lines.push(`공강일: ${constraints.freeDays.map((day) => weekdayLabels[day]).join(", ")}`);
  }
  if (constraints.avoidBefore) lines.push(`${constraints.avoidBefore} 이전 회피`);
  if (constraints.avoidAfter) lines.push(`${constraints.avoidAfter} 이후 회피`);
  if (constraints.minCredits !== null) lines.push(`최소 ${constraints.minCredits}학점`);
  if (constraints.maxCredits !== null) lines.push(`최대 ${constraints.maxCredits}학점`);
  return lines;
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
    >
      {children}
    </div>
  );
}

function FeedbackNotice({
  feedback,
  constraints,
}: {
  feedback: Feedback;
  constraints: Constraints;
}) {
  if (feedback.kind === "unschedulable") {
    return (
      <Notice>
        강의시간 정보가 불완전한 강좌가 있어 자동 조합을 할 수 없습니다:{" "}
        {feedback.courses.map((course) => `${course.name} ${course.classNumber}분반`).join(", ")}
      </Notice>
    );
  }

  if (feedback.kind === "empty") {
    const lines = constraintLines(constraints);
    return (
      <Notice>
        <p className="font-medium">조건을 만족하는 시간표가 없습니다</p>
        {lines.length > 0 ? (
          <ul className="mt-1.5 list-inside list-disc text-xs">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-1.5 text-xs">제약을 하나씩 빼보세요.</p>
      </Notice>
    );
  }

  return (
    <Notice>
      <p className="font-medium">
        {feedback.kind === "unavailable"
          ? "자동 조합에 실패했습니다. 잠시 후 다시 시도해주세요."
          : "조합 조건이 올바르지 않아 시간표를 만들지 못했습니다."}
      </p>
      <p className="mt-1.5 text-xs">{feedback.message}</p>
    </Notice>
  );
}

export default function BuildWorkspace({ semesterKey }: { semesterKey: SemesterKey | null }) {
  const { baskets, constraints, courses } = useBasket();
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();

  const basketCourses = baskets.flatMap((basket) =>
    basket.courseIds
      .map((courseId) => courses[courseId])
      .filter((course): course is Course => Boolean(course)),
  );
  const ready = basketCourses.length > 0 && semesterKey !== null;
  const candidate = result?.timetables[index] ?? null;

  const generate = () => {
    setFeedback(null);

    /** 백엔드가 400으로 거절할 강좌는 담는 시점에 이미 알 수 있다. 부르지 않고 먼저 막는다. */
    const unschedulable = unschedulableCourses(basketCourses);
    if (unschedulable.length > 0) {
      setResult(null);
      setFeedback({ kind: "unschedulable", courses: unschedulable });
      return;
    }

    startTransition(async () => {
      const outcome = await generateTimetables({
        baskets: baskets.map((basket) => ({
          label: basket.label,
          required: basket.required,
          courseIds: basket.courseIds,
        })),
        constraints,
        limit: candidateLimit,
      });

      if (!outcome.ok) {
        setResult(null);
        setFeedback(
          outcome.kind === "unschedulable"
            ? {
                kind: "unschedulable",
                courses: outcome.courses
                  .map(({ id }) => courses[id])
                  .filter((course): course is Course => Boolean(course)),
              }
            : { kind: outcome.kind, message: outcome.message },
        );
        return;
      }

      if (outcome.result.count === 0) {
        setResult(null);
        setFeedback({ kind: "empty" });
        return;
      }

      setResult(outcome.result);
      setIndex(0);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={generate}
          disabled={!ready || pending}
          className="bg-foreground text-background enabled:hover:bg-foreground/85 rounded-md px-4 py-2 text-sm font-medium disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
        >
          {pending ? "조합하는 중..." : "자동 조합"}
        </button>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {basketCourses.length === 0
            ? "강좌 찾기에서 듣고 싶은 강좌를 바구니에 담아주세요."
            : `바구니 ${baskets.length}개 · 분반 ${basketCourses.length}개로 조합합니다.`}
        </p>
      </div>

      {feedback ? <FeedbackNotice feedback={feedback} constraints={constraints} /> : null}

      {result ? (
        <CandidateNav
          index={index}
          total={result.timetables.length}
          truncated={result.truncated}
          onPrev={() => setIndex((current) => Math.max(0, current - 1))}
          onNext={() =>
            setIndex((current) => Math.min(result.timetables.length - 1, current + 1))
          }
        />
      ) : null}

      <TimetableBoard courses={candidate?.courses ?? []} />

      <div>
        <button
          type="button"
          disabled
          className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400 dark:border-gray-700 dark:text-gray-600"
        >
          이 시간표로 확정
        </button>
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
          시간표 저장은 곧 열립니다.
        </p>
      </div>
    </div>
  );
}
