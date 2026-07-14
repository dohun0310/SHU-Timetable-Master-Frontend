"use client";

const buttonClass =
  "rounded-md border border-gray-200 px-3 py-1.5 text-sm font-medium disabled:text-gray-400 enabled:hover:bg-foreground/10 dark:border-gray-700 dark:disabled:text-gray-600";

export default function CandidateNav({
  index,
  total,
  truncated,
  onPrev,
  onNext,
}: {
  index: number;
  total: number;
  truncated: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="bg-foreground/5 rounded-lg border border-gray-100 p-3 dark:border-gray-800">
      <div className="flex items-center justify-between gap-2">
        <p aria-live="polite" className="text-sm font-medium">
          후보 {index + 1} / {total}
        </p>
        <div className="flex gap-1.5">
          <button type="button" onClick={onPrev} disabled={index === 0} className={buttonClass}>
            이전
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={index >= total - 1}
            className={buttonClass}
          >
            다음
          </button>
        </div>
      </div>

      {truncated ? (
        <p className="mt-2 rounded border border-orange-300 bg-orange-50 px-2 py-1 text-xs text-orange-800 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200">
          후보가 너무 많아 일부만 찾았습니다. 조건을 좁혀보세요.
        </p>
      ) : null}
    </div>
  );
}
