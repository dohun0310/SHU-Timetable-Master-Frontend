import type { SavedTimetable, TimetableShelf, Workspace } from "../contracts/timetable-shelf";
import { isStale } from "../timetable/semester";
import type { SemesterKey } from "../timetable/types";

const version = 1;
const workspaceKey = "shu-timetable:workspace";
const savedKey = "shu-timetable:saved";

interface Envelope<T> {
  version: number;
  data: T;
}

function read<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (parsed.version !== version) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function write<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify({ version, data } satisfies Envelope<T>));
  } catch {
    // 저장 공간이 없거나 접근이 막힌 경우. 화면은 계속 동작해야 한다.
  }
}

export class LocalTimetableShelf implements TimetableShelf {
  loadWorkspace(): Workspace | null {
    return read<Workspace>(workspaceKey);
  }

  saveWorkspace(workspace: Workspace): void {
    write(workspaceKey, workspace);
  }

  listTimetables(): SavedTimetable[] {
    return read<SavedTimetable[]>(savedKey) ?? [];
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
