"use client";

import {
  createContext,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { TimetableShelf, Workspace } from "@/lib/contracts/timetable-shelf";
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
  /** 지난 학기 저장본을 정리했는지. 바구니가 왜 비었는지 사용자에게 알려주는 데 쓴다. */
  swept: boolean;
}

interface BasketValue extends BasketSnapshot {
  addCourse(course: Course): void;
  removeCourse(basketId: string, courseId: string): void;
  removeBasket(id: string): void;
  toggleRequired(id: string): void;
  setConstraints(next: Constraints): void;
}

const emptySnapshot: BasketSnapshot = {
  baskets: [],
  constraints: emptyConstraints,
  courses: {},
  swept: false,
};

/** localStorage는 사용자가 직접 고칠 수 있으므로 모양이 깨진 저장본도 빈 상태로 받아넘긴다. */
function snapshotOf(workspace: Workspace | null, swept: boolean): BasketSnapshot {
  if (!workspace) return { ...emptySnapshot, swept };
  return {
    baskets: Array.isArray(workspace.baskets) ? workspace.baskets : [],
    constraints: { ...emptyConstraints, ...workspace.constraints },
    courses: typeof workspace.courses === "object" && workspace.courses ? workspace.courses : {},
    swept,
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
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly shelf: TimetableShelf,
    private readonly semesterKey: SemesterKey | null,
  ) {}

  subscribe = (listener: () => void): (() => void) => {
    if (!this.hydrated) this.hydrate();
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
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

  private hydrate(): void {
    this.hydrated = true;
    const swept = this.semesterKey === null ? false : this.shelf.sweepStale(this.semesterKey);
    this.snapshot = snapshotOf(this.shelf.loadWorkspace(), swept);
  }

  private commit(change: Partial<BasketSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...change };
    this.persist();
    for (const listener of this.listeners) listener();
  }

  /** 학기를 모르는 채 저장하면 나중에 만료를 판정할 수 없다. */
  private persist(): void {
    if (this.semesterKey === null) return;
    const { baskets, constraints, courses } = this.snapshot;
    this.shelf.saveWorkspace({ semesterKey: this.semesterKey, baskets, constraints, courses });
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
