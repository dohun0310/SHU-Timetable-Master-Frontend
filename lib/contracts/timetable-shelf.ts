import type { Basket, Constraints, Course, SemesterKey } from "../timetable/types";

export interface Workspace {
  semesterKey: SemesterKey;
  baskets: Basket[];
  constraints: Constraints;
  /** 바구니에 담긴 강좌의 스냅샷. id로 찾는다. */
  courses: Record<string, Course>;
}

export interface SavedTimetable {
  id: string;
  name: string;
  savedAt: string;
  semesterKey: SemesterKey;
  courses: Course[];
}

/** 정리에서 무엇이 지워졌는지. 지웠는지 여부만으로는 안내 문구를 고를 수 없다. */
export interface SweepReport {
  workspace: boolean;
  timetables: boolean;
}

export interface TimetableShelf {
  loadWorkspace(): Workspace | null;
  saveWorkspace(workspace: Workspace): void;
  listTimetables(): SavedTimetable[];
  saveTimetable(timetable: SavedTimetable): void;
  removeTimetable(id: string): void;
  /**
   * 저장본의 학기가 현재 학기와 다르면 전부 지우고 무엇을 지웠는지 보고한다.
   * currentKey를 모르면(백엔드 다운) 호출하지 않는다.
   */
  sweepStaleReport(currentKey: SemesterKey): SweepReport;
  /** 다른 탭이 저장본을 바꾸면 알린다. 구독 해제 함수를 돌려준다. */
  watchExternalChange(listener: () => void): () => void;
  /** 이 브라우저에서 저장이 실제로 되는지. 사파리 프라이빗 모드 등에서는 false. */
  canPersist(): boolean;
}
