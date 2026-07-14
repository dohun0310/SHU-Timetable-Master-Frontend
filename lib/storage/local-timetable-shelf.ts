import type {
  SavedTimetable,
  SweepReport,
  TimetableShelf,
  Workspace,
} from "../contracts/timetable-shelf";
import { isStale } from "../timetable/semester";
import type { SemesterKey } from "../timetable/types";
import { parseSavedTimetables, parseWorkspace } from "./workspace-validation";

const version = 1;
const keyPrefix = "shu-timetable:";
const workspaceKey = `${keyPrefix}workspace`;
const savedKey = `${keyPrefix}saved`;
const probeKey = `${keyPrefix}probe`;

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
  private persistable: boolean | null = null;

  loadWorkspace(): Workspace | null {
    return parseWorkspace(readData(workspaceKey));
  }

  saveWorkspace(workspace: Workspace): void {
    this.write(workspaceKey, workspace);
  }

  /** 저장본이 깨져 걸러졌으면(참조가 달라짐) 정리된 값으로 곧장 되써서 쓰레기를 남기지 않는다. */
  listTimetables(): SavedTimetable[] {
    const raw = readData(savedKey);
    const parsed = parseSavedTimetables(raw);
    if (raw !== null && raw !== parsed) {
      this.write(savedKey, parsed);
    }
    return parsed;
  }

  saveTimetable(timetable: SavedTimetable): void {
    const next = [
      ...this.listTimetables().filter((saved) => saved.id !== timetable.id),
      timetable,
    ];
    this.write(savedKey, next);
  }

  removeTimetable(id: string): void {
    this.write(
      savedKey,
      this.listTimetables().filter((saved) => saved.id !== id),
    );
  }

  sweepStaleReport(currentKey: SemesterKey): SweepReport {
    const workspace = this.loadWorkspace();
    const saved = this.listTimetables();

    const staleWorkspace = workspace !== null && isStale(workspace.semesterKey, currentKey);
    const staleSaved = saved.filter((entry) => isStale(entry.semesterKey, currentKey));

    if (staleWorkspace && typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(workspaceKey);
      } catch {
        // 접근이 막힌 경우. 어차피 다음 읽기도 실패한다.
      }
    }
    if (staleSaved.length > 0) {
      this.write(
        savedKey,
        saved.filter((entry) => !isStale(entry.semesterKey, currentKey)),
      );
    }

    return { workspace: staleWorkspace, timetables: staleSaved.length > 0 };
  }

  watchExternalChange(listener: () => void): () => void {
    if (typeof window === "undefined") return () => {};
    const handler = (event: StorageEvent) => {
      if (event.storageArea && event.storageArea !== window.localStorage) return;
      if (event.key === null || event.key === workspaceKey || event.key === savedKey) listener();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  canPersist(): boolean {
    if (typeof window === "undefined") return true;
    if (this.persistable === null) {
      try {
        window.localStorage.setItem(probeKey, "1");
        window.localStorage.removeItem(probeKey);
        this.persistable = true;
      } catch {
        this.persistable = false;
      }
    }
    return this.persistable;
  }

  private write(key: string, data: unknown): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify({ version, data } satisfies Envelope));
      this.persistable = true;
    } catch {
      this.persistable = false;
    }
  }
}

export function createLocalTimetableShelf(): TimetableShelf {
  return new LocalTimetableShelf();
}
