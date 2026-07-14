"use client";

import { useBasket } from "@/components/BasketProvider";
import { cn } from "@/lib/utils/cn";
import type { Course } from "@/lib/timetable/types";

export default function BasketButton({ course }: { course: Course }) {
  const { courses, addCourse } = useBasket();
  const added = course.id in courses;

  return (
    <button
      type="button"
      disabled={added}
      onClick={() => addCourse(course)}
      aria-label={added ? `${course.name} 바구니에 담김` : `${course.name} 바구니에 담기`}
      className={cn(
        "shrink-0 rounded-md px-3 py-1.5 text-sm font-medium",
        added
          ? "border border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400"
          : "bg-foreground text-background hover:bg-foreground/85",
      )}
    >
      {added ? "담김" : "바구니에 담기"}
    </button>
  );
}
