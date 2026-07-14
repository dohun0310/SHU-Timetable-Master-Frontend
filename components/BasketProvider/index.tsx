"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type {
  SavedTimetable,
  SweepReport,
  TimetableShelf,
  Workspace,
} from "@/lib/contracts/timetable-shelf";
import {
  emptyConstraints,
  type Basket,
  type Constraints,
  type Course,
  type SemesterKey,
} from "@/lib/timetable/types";

interface BasketSnapshot {
  baskets: Basket[];
  constraints: Constraints;
  courses: Record<string, Course>;
  /** 확정해 둔 시간표들. 바구니와 같은 저장소에 있으므로 같은 스토어가 들고 있는다. */
  timetables: SavedTimetable[];
  /** 지난 학기 저장본을 무엇까지 정리했는지. 왜 비었는지 사용자에게 알려주는 데 쓴다. */
  swept: SweepReport;
  /** 이 브라우저에서 저장이 되는지. 사파리 프라이빗 모드 등에서는 false. */
  canPersist: boolean;
}

interface BasketValue extends BasketSnapshot {
  addCourse(course: Course): void;
  removeCourse(basketId: string, courseId: string): void;
  removeBasket(id: string): void;
  toggleRequired(id: string): void;
  setConstraints(next: Constraints): void;
  saveTimetable(name: string, courses: Course[]): void;
  removeTimetable(id: string): void;
}

const noSweep: SweepReport = { workspace: false, timetables: false };

const emptySnapshot: BasketSnapshot = {
  baskets: [],
  constraints: emptyConstraints,
  courses: {},
  timetables: [],
  swept: noSweep,
  canPersist: true,
};

function workspaceOf(workspace: Workspace | null): Pick<
  BasketSnapshot,
  "baskets" | "constraints" | "courses"
> {
  if (!workspace) return { baskets: [], constraints: emptyConstraints, courses: {} };
  return {
    baskets: workspace.baskets,
    constraints: workspace.constraints,
    courses: workspace.courses,
  };
}

function basketCourseCode(basket: Basket, courses: Record<string, Course>): string | null {
  for (const courseId of basket.courseIds) {
    const course = courses[courseId];
    if (course) return course.courseCode;
  }
  return null;
}

/** 어느 바구니에서도 참조하지 않는 강좌 스냅샷은 들고 있을 이유가 없다. */
function pruneCourses(baskets: Basket[], courses: Record<string, Course>): Record<string, Course> {
  const used = new Set(baskets.flatMap((basket) => basket.courseIds));
  return Object.fromEntries(Object.entries(courses).filter(([courseId]) => used.has(courseId)));
}

/**
 * localStorage를 감싼 외부 저장소. SSR과 클라이언트 첫 렌더는 빈 스냅샷으로 맞추고,
 * 구독이 시작된 뒤에야 실제 저장본을 읽어 hydration 불일치를 피한다.
 */
class BasketStore {
  private snapshot = emptySnapshot;
  private hydrated = false;
  private unwatch: (() => void) | null = null;
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly shelf: TimetableShelf,
    private readonly semesterKey: SemesterKey | null,
  ) {}

  subscribe = (listener: () => void): (() => void) => {
    if (!this.hydrated) this.hydrate();
    this.listeners.add(listener);
    if (this.listeners.size === 1) this.watch();
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) this.stopWatching();
    };
  };

  getSnapshot = (): BasketSnapshot => this.snapshot;

  getServerSnapshot = (): BasketSnapshot => emptySnapshot;

  addCourse = (course: Course): void => {
    const { baskets, courses } = this.snapshot;
    const merged = { ...courses, [course.id]: course };
    const sameSubject = baskets.find(
      (basket) => basketCourseCode(basket, courses) === course.courseCode,
    );

    if (!sameSubject) {
      const basket: Basket = {
        id: crypto.randomUUID(),
        label: course.name,
        required: true,
        courseIds: [course.id],
      };
      this.commit({ baskets: [...baskets, basket], courses: merged });
      return;
    }

    if (sameSubject.courseIds.includes(course.id)) {
      this.commit({ courses: merged });
      return;
    }

    this.commit({
      baskets: baskets.map((basket) =>
        basket.id === sameSubject.id
          ? { ...basket, courseIds: [...basket.courseIds, course.id] }
          : basket,
      ),
      courses: merged,
    });
  };

  removeCourse = (basketId: string, courseId: string): void => {
    const baskets = this.snapshot.baskets
      .map((basket) =>
        basket.id === basketId
          ? { ...basket, courseIds: basket.courseIds.filter((id) => id !== courseId) }
          : basket,
      )
      .filter((basket) => basket.courseIds.length > 0);
    this.commit({ baskets, courses: pruneCourses(baskets, this.snapshot.courses) });
  };

  removeBasket = (id: string): void => {
    const baskets = this.snapshot.baskets.filter((basket) => basket.id !== id);
    this.commit({ baskets, courses: pruneCourses(baskets, this.snapshot.courses) });
  };

  toggleRequired = (id: string): void => {
    this.commit({
      baskets: this.snapshot.baskets.map((basket) =>
        basket.id === id ? { ...basket, required: !basket.required } : basket,
      ),
    });
  };

  setConstraints = (next: Constraints): void => {
    this.commit({ constraints: next });
  };

  /**
   * 확정한 시간표는 바구니와 달리 스냅샷을 통째로 들고 저장한다. 나중에 백엔드에 닿지 못해도
   * 열어볼 수 있어야 하기 때문이다. 학기를 모르면 만료를 판정할 수 없으므로 저장하지 않는다.
   */
  saveTimetable = (name: string, courses: Course[]): void => {
    if (this.semesterKey === null) return;
    this.shelf.saveTimetable({
      id: crypto.randomUUID(),
      name,
      savedAt: new Date().toISOString(),
      semesterKey: this.semesterKey,
      courses,
    });
    this.commit({ timetables: this.shelf.listTimetables(), canPersist: this.shelf.canPersist() });
  };

  removeTimetable = (id: string): void => {
    this.shelf.removeTimetable(id);
    this.commit({ timetables: this.shelf.listTimetables() });
  };

  /** 다른 탭이 저장한 내용을 이 탭 상태로 가져온다. 오래된 상태로 덮어써 잃는 것을 막는다. */
  private reload = (): void => {
    this.snapshot = {
      ...this.snapshot,
      ...workspaceOf(this.shelf.loadWorkspace()),
      timetables: this.shelf.listTimetables(),
    };
    this.emit();
  };

  private watch(): void {
    if (this.unwatch) return;
    this.unwatch = this.shelf.watchExternalChange(this.reload);
  }

  private stopWatching(): void {
    this.unwatch?.();
    this.unwatch = null;
  }

  /** 만료 정리를 먼저 끝내야 지워진 저장본을 다시 읽어들이지 않는다. */
  private hydrate(): void {
    this.hydrated = true;
    const swept = this.sweep();
    this.snapshot = {
      ...workspaceOf(this.shelf.loadWorkspace()),
      timetables: this.shelf.listTimetables(),
      swept,
      canPersist: this.shelf.canPersist(),
    };
  }

  /** 학기를 모르면(백엔드 다운) 만료를 판정할 수 없으므로 아무것도 지우지 않는다. */
  private sweep(): SweepReport {
    if (this.semesterKey === null) return noSweep;
    return this.shelf.sweepStaleReport(this.semesterKey);
  }

  private commit(change: Partial<BasketSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...change };
    this.persist();
    this.emit();
  }

  /** 학기를 모르는 채 저장하면 나중에 만료를 판정할 수 없다. */
  private persist(): void {
    if (this.semesterKey === null) return;
    const { baskets, constraints, courses } = this.snapshot;
    this.shelf.saveWorkspace({ semesterKey: this.semesterKey, baskets, constraints, courses });
    const canPersist = this.shelf.canPersist();
    if (canPersist !== this.snapshot.canPersist) {
      this.snapshot = { ...this.snapshot, canPersist };
    }
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

const BasketContext = createContext<BasketValue | null>(null);

export default function BasketProvider({
  shelf,
  semesterKey,
  children,
}: {
  shelf: TimetableShelf;
  semesterKey: SemesterKey | null;
  children: ReactNode;
}) {
  const store = useMemo(() => new BasketStore(shelf, semesterKey), [shelf, semesterKey]);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  const value = useMemo<BasketValue>(
    () => ({
      ...snapshot,
      addCourse: store.addCourse,
      removeCourse: store.removeCourse,
      removeBasket: store.removeBasket,
      toggleRequired: store.toggleRequired,
      setConstraints: store.setConstraints,
      saveTimetable: store.saveTimetable,
      removeTimetable: store.removeTimetable,
    }),
    [snapshot, store],
  );

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket(): BasketValue {
  const value = useContext(BasketContext);
  if (!value) throw new Error("useBasket은 BasketProvider 안에서만 쓸 수 있습니다.");
  return value;
}
