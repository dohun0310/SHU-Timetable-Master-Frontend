import type { TimetableShelf } from "../contracts/timetable-shelf";
import type { SemesterKey } from "../timetable/types";

/** 무엇이 정리됐는지. sweepStale의 boolean만으로는 안내 문구를 고를 수 없다. */
export interface SweepReport {
  workspace: boolean;
  timetables: boolean;
}

/**
 * 저장소 구현체가 선택적으로 제공하는 능력.
 * TimetableShelf 계약에 없으므로 화면은 이것 없이도 그대로 동작해야 한다.
 */
export interface ShelfCapabilities {
  /** 다른 탭이 저장본을 바꾸면 알린다. 구독 해제 함수를 돌려준다. */
  watchExternalChange(listener: () => void): () => void;
  sweepStaleReport(currentKey: SemesterKey): SweepReport;
  /** 이 브라우저에서 저장이 실제로 되는지. */
  canPersist(): boolean;
}

export function shelfCapabilitiesOf(shelf: TimetableShelf): ShelfCapabilities | null {
  const candidate = shelf as Partial<ShelfCapabilities>;
  const supported =
    typeof candidate.watchExternalChange === "function" &&
    typeof candidate.sweepStaleReport === "function" &&
    typeof candidate.canPersist === "function";
  return supported ? (candidate as ShelfCapabilities) : null;
}
