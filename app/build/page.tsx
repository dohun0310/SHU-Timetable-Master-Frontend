import BuildWorkspace from "@/components/BuildWorkspace";
import { createCourseCatalog } from "@/lib/catalog";
import { CatalogUnavailableError } from "@/lib/contracts/errors";
import { semesterKeyOf } from "@/lib/timetable/semester";
import type { SemesterKey } from "@/lib/timetable/types";

/** 학기를 모르면 자동 조합을 걸 수 없다. 그래도 화면은 떠야 하므로 null로 넘긴다. */
async function loadSemesterKey(): Promise<SemesterKey | null> {
  try {
    return semesterKeyOf((await createCourseCatalog().meta()).semester);
  } catch (error) {
    if (error instanceof CatalogUnavailableError) return null;
    throw error;
  }
}

export default async function BuildPage() {
  const semesterKey = await loadSemesterKey();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">시간표 만들기</h1>

      {semesterKey === null ? (
        <p className="rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-800 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200">
          백엔드에 연결할 수 없어 자동 조합을 사용할 수 없습니다. 저장된 시간표는 내 시간표에서 볼
          수 있습니다.
        </p>
      ) : null}

      <BuildWorkspace semesterKey={semesterKey} />
    </div>
  );
}
