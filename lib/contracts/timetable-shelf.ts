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

export interface TimetableShelf {
  loadWorkspace(): Workspace | null;
  saveWorkspace(workspace: Workspace): void;
  listTimetables(): SavedTimetable[];
  saveTimetable(timetable: SavedTimetable): void;
  removeTimetable(id: string): void;
  /**
   * 저장본의 학기가 현재 학기와 다르면 전부 지우고 true를 반환한다.
   * 지울 것이 없으면 false. currentKey를 모르면(백엔드 다운) 호출하지 않는다.
   */
  sweepStale(currentKey: SemesterKey): boolean;
}
