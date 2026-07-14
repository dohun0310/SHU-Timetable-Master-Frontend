"use client";

import type { SavedTimetable } from "@/lib/contracts/timetable-shelf";
import { totalCredits } from "@/lib/timetable/credits";
import { cn } from "@/lib/utils/cn";

function savedAtText(savedAt: string): string {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function SavedList({
  timetables,
  openedId,
  onOpen,
  onRemove,
}: {
  timetables: SavedTimetable[];
  openedId: string | null;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {timetables.map((timetable) => (
        <li
          key={timetable.id}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2",
            timetable.id === openedId
              ? "border-foreground"
              : "border-gray-100 dark:border-gray-800",
          )}
        >
          <button
            type="button"
            onClick={() => onOpen(timetable.id)}
            aria-pressed={timetable.id === openedId}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block truncate text-sm font-medium">{timetable.name}</span>
            <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
              강좌 {timetable.courses.length}개 · 총 {totalCredits(timetable.courses)}학점 ·{" "}
              {savedAtText(timetable.savedAt)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onRemove(timetable.id)}
            aria-label={`${timetable.name} 삭제`}
            className="hover:bg-foreground/10 shrink-0 rounded px-2 py-1 text-xs text-gray-500 dark:text-gray-400"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}
