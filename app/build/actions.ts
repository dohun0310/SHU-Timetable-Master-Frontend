"use server";

import { createTimetableMaker } from "@/lib/catalog";
import {
  CatalogUnavailableError,
  InvalidQueryError,
  UnschedulableCoursesError,
} from "@/lib/contracts/errors";
import type { GenerateRequest, GenerateResult } from "@/lib/contracts/timetable-maker";

/** 예외 대신 판별 가능한 결과를 돌려준다. 화면이 종류별로 다른 안내를 고를 수 있어야 한다. */
export type GenerateOutcome =
  | { ok: true; result: GenerateResult }
  | {
      ok: false;
      kind: "unschedulable";
      message: string;
      courses: Array<{ id: string; name: string }>;
    }
  | { ok: false; kind: "invalid" | "unavailable"; message: string };

export async function generateTimetables(request: GenerateRequest): Promise<GenerateOutcome> {
  try {
    const result = await createTimetableMaker().generate(request);
    return { ok: true, result };
  } catch (error) {
    if (error instanceof UnschedulableCoursesError) {
      return { ok: false, kind: "unschedulable", message: error.message, courses: error.courses };
    }
    if (error instanceof InvalidQueryError) {
      return { ok: false, kind: "invalid", message: error.message };
    }
    if (error instanceof CatalogUnavailableError) {
      return { ok: false, kind: "unavailable", message: error.message };
    }
    throw error;
  }
}
