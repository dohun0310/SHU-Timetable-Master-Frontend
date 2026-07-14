import type { SavedTimetable, TimetableShelf, Workspace } from "../contracts/timetable-shelf";
import { isStale } from "../timetable/semester";
import type { SemesterKey } from "../timetable/types";
import { parseSavedTimetables, parseWorkspace } from "./workspace-validation";

const version = 1;
const keyPrefix = "shu-timetable:";
const workspaceKey = `${keyPrefix}workspace`;
const savedKey = `${keyPrefix}saved`;

interface Envelope {
  version: number;
  data: unknown;
}

function readData(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope;
    if (parsed.version !== version) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function write(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ version, data } satisfies Envelope));
  } catch {
    // 저장 공간이 없거나 접근이 막힌 경우. 화면은 계속 동작해야 한다.
  }
}

/** 저장본이 깨져 화면이 터졌을 때 사용자가 스스로 빠져나오는 유일한 길. */
export function clearStoredData(): void {
  if (typeof window === "undefined") return;
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (key.startsWith(keyPrefix)) window.localStorage.removeItem(key);
    }
  } catch {
    // 접근 자체가 막힌 경우. 지울 것도 없다.
  }
}

export class LocalTimetableShelf implements TimetableShelf {
  loadWorkspace(): Workspace | null {
    return parseWorkspace(readData(workspaceKey));
  }

  saveWorkspace(workspace: Workspace): void {
    write(workspaceKey, workspace);
  }

  listTimetables(): SavedTimetable[] {
    return parseSavedTimetables(readData(savedKey));
  }

  saveTimetable(timetable: SavedTimetable): void {
    const next = [
      ...this.listTimetables().filter((saved) => saved.id !== timetable.id),
      timetable,
    ];
    write(savedKey, next);
  }

  removeTimetable(id: string): void {
    write(
      savedKey,
      this.listTimetables().filter((saved) => saved.id !== id),
    );
  }

  sweepStale(currentKey: SemesterKey): boolean {
    const workspace = this.loadWorkspace();
    const saved = this.listTimetables();

    const staleWorkspace = workspace !== null && isStale(workspace.semesterKey, currentKey);
    const staleSaved = saved.filter((entry) => isStale(entry.semesterKey, currentKey));

    if (!staleWorkspace && staleSaved.length === 0) return false;

    if (staleWorkspace && typeof window !== "undefined") {
      window.localStorage.removeItem(workspaceKey);
    }
    if (staleSaved.length > 0) {
      write(
        savedKey,
        saved.filter((entry) => !isStale(entry.semesterKey, currentKey)),
      );
    }
    return true;
  }
}

export function createLocalTimetableShelf(): TimetableShelf {
  return new LocalTimetableShelf();
}
