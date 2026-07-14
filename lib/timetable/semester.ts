import type { SemesterInfo, SemesterKey } from "./types";

export function semesterKeyOf(info: SemesterInfo): SemesterKey {
  return `${info.academicYear}-${info.semester}`;
}

/** 저장본의 학기가 현재 학기와 다르면 만료다. 카탈로그 내용 변경만으로는 만료시키지 않는다. */
export function isStale(savedKey: SemesterKey, currentKey: SemesterKey): boolean {
  return savedKey !== currentKey;
}
