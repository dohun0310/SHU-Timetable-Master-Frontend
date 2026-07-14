"use client";

import { useState, useTransition } from "react";

import { generateTimetables } from "@/app/build/actions";
import BasketPanel from "@/components/BasketPanel";
import { useBasket } from "@/components/BasketProvider";
import CandidateNav from "@/components/CandidateNav";
import ConstraintsPanel from "@/components/ConstraintsPanel";
import TimetableBoard from "@/components/TimetableBoard";
import type { GenerateResult } from "@/lib/contracts/timetable-maker";
import { conflictingCourseIds } from "@/lib/timetable/conflict";
import { unschedulableCourses } from "@/lib/timetable/schedulability";
import {
  weekdayLabels,
  type Basket,
  type Constraints,
  type Course,
  type SemesterKey,
} from "@/lib/timetable/types";

const candidateLimit = 20;

type Feedback =
  | { kind: "unschedulable"; courses: Course[] }
  | { kind: "empty" }
  | { kind: "invalid" | "unavailable"; message: string };

/** 조합에 쓴 결과와, 그 결과를 만든 입력. 입력이 바뀌었는지 렌더 중에 비교하려고 함께 들고 있는다. */
interface Outcome {
  signature: string;
  result: GenerateResult | null;
  feedback: Feedback | null;
}

/**
 * 결과를 만들어낸 입력(바구니 구성·제약)의 지문. 이 값이 달라지면 화면에 남은 결과는 더 이상
 * 지금 조건의 답이 아니다. 서버로 보내는 값은 모두 지문에 넣는다. 담긴 순서만 달라진 것은
 * 같은 입력이므로, 헛되이 결과를 버리지 않도록 정렬해서 이어붙인다.
 */
function inputSignature(baskets: Basket[], constraints: Constraints): string {
  const basketPart = baskets
    .map(
      (basket) =>
        `${basket.id}:${basket.label}:${basket.required ? 1 : 0}:${[...basket.courseIds].sort().join(",")}`,
    )
    .sort()
    .join("|");
  const { freeDays, avoidBefore, avoidAfter, minCredits, maxCredits } = constraints;
  const constraintPart = [
    [...freeDays].sort().join(","),
    avoidBefore ?? "",
    avoidAfter ?? "",
    minCredits ?? "",
    maxCredits ?? "",
  ].join("/");
  return `${basketPart}#${constraintPart}`;
}

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
      className="rounded-lg border border-orange-300 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200"
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
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [index, setIndex] = useState(0);
  const [boardCourseIds, setBoardCourseIds] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const basketCourses = baskets.flatMap((basket) =>
    basket.courseIds
      .map((courseId) => courses[courseId])
      .filter((course): course is Course => Boolean(course)),
  );
  const ready = basketCourses.length > 0 && semesterKey !== null;

  /**
   * 바구니나 제약이 바뀌면 지난 후보 목록은 지금 조건의 답이 아니다. 렌더 중에 지문을 비교해
   * 버린다. (`useEffect`로 지우면 낡은 후보가 한 프레임 남는다.) 보드는 지우지 않는다 —
   * 제약은 후보를 찾는 조건일 뿐이고, 보드는 사용자가 만들고 있는 시간표다.
   */
  const signature = inputSignature(baskets, constraints);
  const stale = outcome !== null && outcome.signature !== signature;
  const result = stale ? null : (outcome?.result ?? null);
  const feedback = stale ? null : (outcome?.feedback ?? null);
  const candidate = result?.timetables[index] ?? null;

  /** 바구니에서 빠진 강좌는 스냅샷이 없으니 보드에도 남을 수 없다. 그릴 때 자연히 걸러진다. */
  const boardCourses = boardCourseIds
    .map((courseId) => courses[courseId])
    .filter((course): course is Course => Boolean(course));
  const conflicted = conflictingCourseIds(boardCourses);

  /** 후보와 보드가 어긋나면 손으로 고쳤다는 뜻이다. 후보를 넘기면 그 편집이 덮인다고 미리 알린다. */
  const edited =
    candidate !== null &&
    (candidate.courses.length !== boardCourses.length ||
      candidate.courses.some((course) => !boardCourseIds.includes(course.id)));

  const showCandidate = (nextIndex: number, from: GenerateResult) => {
    const next = from.timetables[nextIndex];
    if (!next) return;
    setIndex(nextIndex);
    setBoardCourseIds(next.courses.map((course) => course.id));
  };

  const togglePlace = (courseId: string) => {
    setBoardCourseIds((current) =>
      current.includes(courseId)
        ? current.filter((placed) => placed !== courseId)
        : [...current, courseId],
    );
  };

  const removeFromBoard = (courseId: string) => {
    setBoardCourseIds((current) => current.filter((placed) => placed !== courseId));
  };

  const generate = () => {
    /** 백엔드가 400으로 거절할 강좌는 담는 시점에 이미 알 수 있다. 부르지 않고 먼저 막는다. */
    const unschedulable = unschedulableCourses(basketCourses);
    if (unschedulable.length > 0) {
      setOutcome({
        signature,
        result: null,
        feedback: { kind: "unschedulable", courses: unschedulable },
      });
      return;
    }

    setOutcome(null);

    startTransition(async () => {
      const generated = await generateTimetables({
        baskets: baskets.map((basket) => ({
          label: basket.label,
          required: basket.required,
          courseIds: basket.courseIds,
        })),
        constraints,
        limit: candidateLimit,
      });

      if (!generated.ok) {
        setOutcome({
          signature,
          result: null,
          feedback:
            generated.kind === "unschedulable"
              ? {
                  kind: "unschedulable",
                  courses: generated.courses
                    .map(({ id }) => courses[id])
                    .filter((course): course is Course => Boolean(course)),
                }
              : { kind: generated.kind, message: generated.message },
        });
        return;
      }

      if (generated.result.count === 0) {
        setOutcome({ signature, result: null, feedback: { kind: "empty" } });
        return;
      }

      setOutcome({ signature, result: generated.result, feedback: null });
      showCandidate(0, generated.result);
    });
  };

  const confirmBlockedReason =
    boardCourses.length === 0
      ? "보드에 강좌를 넣어야 확정할 수 있습니다."
      : conflicted.size > 0
        ? "겹치는 강좌가 있어 확정할 수 없습니다. 겹치는 강좌를 빼주세요."
        : "시간표 저장은 곧 열립니다.";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19rem_1fr]">
      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <BasketPanel onPlace={togglePlace} placedCourseIds={boardCourseIds} />
        <ConstraintsPanel />
      </aside>

      <div className="flex min-w-0 flex-col gap-4">
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
              : `바구니 ${baskets.length}개 · 분반 ${basketCourses.length}개로 조합합니다. 바구니에서 직접 보드에 넣어 만들 수도 있습니다.`}
          </p>
        </div>

        {stale ? (
          <Notice>조건이 바뀌었습니다. 보드는 그대로 두었으니 필요하면 다시 조합해주세요.</Notice>
        ) : null}

        {feedback ? <FeedbackNotice feedback={feedback} constraints={constraints} /> : null}

        {result ? (
          <>
            <CandidateNav
              index={index}
              total={result.timetables.length}
              truncated={result.truncated}
              onPrev={() => showCandidate(Math.max(0, index - 1), result)}
              onNext={() =>
                showCandidate(Math.min(result.timetables.length - 1, index + 1), result)
              }
            />
            {edited ? (
              <Notice>
                손으로 고친 시간표입니다. 후보를 넘기면 이 내용이 그 후보로 바뀝니다.
              </Notice>
            ) : null}
          </>
        ) : null}

        <TimetableBoard courses={boardCourses} onRemove={removeFromBoard} />

        <div>
          <button
            type="button"
            disabled
            className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-400 dark:border-gray-700 dark:text-gray-600"
          >
            이 시간표로 확정
          </button>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{confirmBlockedReason}</p>
        </div>
      </div>
    </div>
  );
}
