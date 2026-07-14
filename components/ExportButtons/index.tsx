"use client";

import { useState } from "react";

import { exportTimetablePdf, exportTimetablePng } from "@/lib/export";
import type { Course } from "@/lib/timetable/types";

/** 보드에 강좌가 없으면 내보낼 것이 없다. */
export default function ExportButtons({ courses, name }: { courses: Course[]; name: string }) {
  const [failed, setFailed] = useState(false);
  const disabled = courses.length === 0;

  const run = async (kind: "png" | "pdf") => {
    setFailed(false);
    try {
      if (kind === "png") await exportTimetablePng(courses, name);
      else exportTimetablePdf(courses, name);
    } catch {
      setFailed(true);
    }
  };

  const buttonClass =
    "rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium enabled:hover:bg-foreground/10 disabled:text-gray-400 dark:border-gray-700 dark:disabled:text-gray-600";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => run("png")} disabled={disabled} className={buttonClass}>
        PNG로 저장
      </button>
      <button type="button" onClick={() => run("pdf")} disabled={disabled} className={buttonClass}>
        PDF로 저장
      </button>
      {failed ? (
        <p role="status" className="text-xs text-gray-500 dark:text-gray-400">
          내보내지 못했습니다. 다시 시도해주세요.
        </p>
      ) : null}
    </div>
  );
}
