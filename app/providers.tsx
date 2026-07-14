"use client";

import { useMemo, type ReactNode } from "react";

import BasketProvider from "@/components/BasketProvider";
import { createLocalTimetableShelf } from "@/lib/storage/local-timetable-shelf";
import type { SemesterKey } from "@/lib/timetable/types";

/** 저장소 구현체를 고르는 유일한 자리. 화면은 TimetableShelf 인터페이스만 알면 된다. */
export default function Providers({
  semesterKey,
  children,
}: {
  semesterKey: SemesterKey | null;
  children: ReactNode;
}) {
  const shelf = useMemo(() => createLocalTimetableShelf(), []);

  return (
    <BasketProvider shelf={shelf} semesterKey={semesterKey}>
      {children}
    </BasketProvider>
  );
}
