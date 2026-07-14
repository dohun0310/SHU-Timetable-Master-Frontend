"use client";

import Link from "next/link";
import { useState } from "react";

import { useBasket } from "@/components/BasketProvider";
import ExportButtons from "@/components/ExportButtons";
import SavedList from "@/components/SavedList";
import TimetableBoard from "@/components/TimetableBoard";
import type { SweepReport } from "@/lib/contracts/timetable-shelf";

/** 저장된 시간표만 정리된 경우와 바구니까지 정리된 경우의 문구가 달라야 한다. */
function sweptText(swept: SweepReport): string | null {
  if (swept.timetables) return "새 학기가 시작되어 지난 학기 시간표를 정리했습니다.";
  if (swept.workspace) return "새 학기가 시작되어 지난 학기 바구니를 정리했습니다.";
  return null;
}

/**
 * 저장된 시간표는 localStorage에만 있다. 백엔드에 닿지 못해도 이 화면은 그대로 동작해야 하므로
 * 서버에서 아무것도 가져오지 않는다.
 */
export default function MyTimetables() {
  const { timetables, swept, removeTimetable } = useBasket();
  const [openedId, setOpenedId] = useState<string | null>(null);

  const opened = timetables.find((timetable) => timetable.id === openedId) ?? null;
  const sweptNotice = sweptText(swept);

  const remove = (id: string) => {
    removeTimetable(id);
    if (id === openedId) setOpenedId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {sweptNotice ? (
        <p
          role="status"
          className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200"
        >
          {sweptNotice}
        </p>
      ) : null}

      {timetables.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-3 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
          저장된 시간표가 없습니다.{" "}
          <Link href="/build" className="text-foreground font-medium underline">
            시간표 만들기
          </Link>
          에서 만들어보세요.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[19rem_1fr]">
          <section className="bg-foreground/5 rounded-lg border border-gray-100 p-4 lg:sticky lg:top-20 lg:self-start dark:border-gray-800">
            <h2 className="mb-3 text-sm font-semibold">저장된 시간표 {timetables.length}개</h2>
            <SavedList
              timetables={timetables}
              openedId={openedId}
              onOpen={setOpenedId}
              onRemove={remove}
            />
          </section>

          <div className="min-w-0">
            {opened ? (
              <div className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold">{opened.name}</h2>
                <TimetableBoard courses={opened.courses} />
                <ExportButtons courses={opened.courses} name={opened.name} />
              </div>
            ) : (
              <p className="rounded-lg border border-dashed border-gray-200 px-3 py-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                왼쪽에서 시간표를 골라 열어보세요.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
